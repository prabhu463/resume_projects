"""
Alert Notification Service for Aircraft Tracking System.
Sends alerts for preventive actions via multiple channels.
"""
import asyncio
import logging
from typing import Optional, List
from abc import ABC, abstractmethod

from src.sensors.models import Alert, AlertSeverity
from config.settings import AlertConfig


logger = logging.getLogger(__name__)


class NotificationChannel(ABC):
    """Abstract base for notification channels."""
    
    @abstractmethod
    async def send(self, alert: Alert) -> bool:
        """Send notification. Returns True if successful."""
        pass


class TelegramNotifier(NotificationChannel):
    """Telegram notification channel."""
    
    def __init__(self, bot_token: str, chat_id: str):
        self.bot_token = bot_token
        self.chat_id = chat_id
        
    async def send(self, alert: Alert) -> bool:
        """Send alert via Telegram."""
        try:
            from telegram import Bot
            
            bot = Bot(token=self.bot_token)
            
            # Format message
            severity_emoji = {
                AlertSeverity.INFO: "ℹ️",
                AlertSeverity.WARNING: "⚠️",
                AlertSeverity.CRITICAL: "🚨",
                AlertSeverity.EMERGENCY: "🆘",
            }
            
            message = (
                f"{severity_emoji.get(alert.severity, '📢')} *{alert.severity.value.upper()}*\n\n"
                f"*{alert.title}*\n"
                f"Aircraft: `{alert.aircraft_id}`\n"
                f"{alert.message}\n"
                f"\n_Time: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}_"
            )
            
            await bot.send_message(
                chat_id=self.chat_id,
                text=message,
                parse_mode="Markdown"
            )
            
            logger.info(f"Sent Telegram notification for alert {alert.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")
            return False


class SMSNotifier(NotificationChannel):
    """SMS notification channel using Twilio."""
    
    def __init__(self, account_sid: str, auth_token: str, from_number: str, to_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self.to_number = to_number
        
    async def send(self, alert: Alert) -> bool:
        """Send alert via SMS."""
        try:
            from twilio.rest import Client
            
            client = Client(self.account_sid, self.auth_token)
            
            message = (
                f"[{alert.severity.value.upper()}] {alert.title}\n"
                f"Aircraft: {alert.aircraft_id}\n"
                f"{alert.message[:100]}..."  # Truncate for SMS
            )
            
            client.messages.create(
                body=message,
                from_=self.from_number,
                to=self.to_number
            )
            
            logger.info(f"Sent SMS notification for alert {alert.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS notification: {e}")
            return False


class WebhookNotifier(NotificationChannel):
    """Webhook notification channel."""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
        
    async def send(self, alert: Alert) -> bool:
        """Send alert via webhook."""
        try:
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_url,
                    json=alert.to_dict(),
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        logger.info(f"Sent webhook notification for alert {alert.id}")
                        return True
                    else:
                        logger.error(f"Webhook returned status {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")
            return False


class AlertNotifier:
    """
    Alert notification service.
    Routes alerts to appropriate channels based on severity.
    """
    
    def __init__(self, config: AlertConfig):
        self.config = config
        self.channels: List[NotificationChannel] = []
        self._setup_channels()
        
    def _setup_channels(self) -> None:
        """Initialize notification channels from config."""
        # Telegram
        if self.config.telegram_bot_token and self.config.telegram_chat_id:
            self.channels.append(
                TelegramNotifier(
                    self.config.telegram_bot_token,
                    self.config.telegram_chat_id
                )
            )
            
        # SMS (only for critical/emergency)
        if (self.config.twilio_account_sid and 
            self.config.twilio_auth_token and 
            self.config.alert_phone_number):
            self.sms_notifier = SMSNotifier(
                self.config.twilio_account_sid,
                self.config.twilio_auth_token,
                "+1234567890",  # From number
                self.config.alert_phone_number
            )
        else:
            self.sms_notifier = None
            
    async def notify(self, alert: Alert) -> None:
        """
        Send alert notifications.
        Routes to appropriate channels based on severity.
        """
        tasks = []
        
        # All alerts go to regular channels
        for channel in self.channels:
            tasks.append(channel.send(alert))
            
        # Critical and emergency alerts also go via SMS
        if self.sms_notifier and alert.severity in [AlertSeverity.CRITICAL, AlertSeverity.EMERGENCY]:
            tasks.append(self.sms_notifier.send(alert))
            
        # Send all notifications concurrently
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            success_count = sum(1 for r in results if r is True)
            logger.info(
                f"Alert {alert.id} sent to {success_count}/{len(tasks)} channels"
            )
            
    def add_channel(self, channel: NotificationChannel) -> None:
        """Add notification channel."""
        self.channels.append(channel)
