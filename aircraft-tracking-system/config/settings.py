"""
Configuration settings for Aircraft Tracking and Maintenance System.
"""
import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class DatabaseConfig:
    """Database configuration."""
    host: str = os.getenv("DB_HOST", "localhost")
    port: int = int(os.getenv("DB_PORT", "5432"))
    name: str = os.getenv("DB_NAME", "aircraft_tracking")
    user: str = os.getenv("DB_USER", "postgres")
    password: str = os.getenv("DB_PASSWORD", "")
    
    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"


@dataclass
class MQTTConfig:
    """MQTT broker configuration for sensor data."""
    broker_host: str = os.getenv("MQTT_HOST", "localhost")
    broker_port: int = int(os.getenv("MQTT_PORT", "1883"))
    username: Optional[str] = os.getenv("MQTT_USER")
    password: Optional[str] = os.getenv("MQTT_PASSWORD")
    client_id: str = os.getenv("MQTT_CLIENT_ID", "aircraft-monitoring")
    
    # Topic patterns
    sensor_topic: str = "aircraft/+/sensors/#"
    alert_topic: str = "aircraft/+/alerts"
    maintenance_topic: str = "aircraft/+/maintenance"


@dataclass
class AlertConfig:
    """Alert thresholds and notification settings."""
    # Temperature thresholds (Celsius)
    engine_temp_warning: float = 85.0
    engine_temp_critical: float = 95.0
    
    # Pressure thresholds (PSI)
    oil_pressure_low: float = 25.0
    oil_pressure_critical: float = 15.0
    hydraulic_pressure_low: float = 2800.0
    
    # Vibration thresholds (mm/s)
    vibration_warning: float = 4.5
    vibration_critical: float = 7.1
    
    # Fuel thresholds (percentage)
    fuel_low: float = 20.0
    fuel_critical: float = 10.0
    
    # Notification settings
    telegram_bot_token: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN")
    telegram_chat_id: Optional[str] = os.getenv("TELEGRAM_CHAT_ID")
    twilio_account_sid: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    alert_phone_number: Optional[str] = os.getenv("ALERT_PHONE_NUMBER")


@dataclass
class MaintenanceConfig:
    """Maintenance scheduling configuration."""
    # Flight hours for scheduled maintenance
    a_check_hours: int = 500
    b_check_hours: int = 2000
    c_check_hours: int = 6000
    d_check_hours: int = 25000
    
    # Days before maintenance for alerts
    advance_warning_days: int = 7
    
    # Component replacement thresholds (hours)
    oil_filter_hours: int = 500
    fuel_filter_hours: int = 1000
    brake_pad_hours: int = 750


@dataclass
class Config:
    """Main configuration."""
    database: DatabaseConfig
    mqtt: MQTTConfig
    alerts: AlertConfig
    maintenance: MaintenanceConfig
    
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))


def get_config() -> Config:
    """Get application configuration."""
    return Config(
        database=DatabaseConfig(),
        mqtt=MQTTConfig(),
        alerts=AlertConfig(),
        maintenance=MaintenanceConfig(),
    )
