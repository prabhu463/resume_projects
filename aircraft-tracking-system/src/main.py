"""
Aircraft Tracking and Maintenance System
Main application entry point.

Built for real-time monitoring and maintenance tracking of aircraft.
Features:
- Real-time sensor data collection via MQTT
- Automated performance logging
- Maintenance schedule tracking
- Alert system for preventive actions
- Early fault detection through anomaly analysis
"""
import asyncio
import logging
import signal
from typing import Optional

from config.settings import get_config, Config
from src.sensors.collector import SensorDataCollector
from src.monitoring.engine import MonitoringEngine
from src.maintenance.scheduler import MaintenanceScheduler
from src.alerts.notifier import AlertNotifier


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AircraftTrackingSystem:
    """
    Main application class for Aircraft Tracking and Maintenance System.
    
    Improves operational safety and efficiency by:
    - Reducing manual checks through automated monitoring
    - Enabling early fault detection
    - Automating maintenance scheduling and alerts
    """
    
    def __init__(self, config: Config):
        self.config = config
        self._running = False
        
        # Initialize components
        self.sensor_collector: Optional[SensorDataCollector] = None
        self.monitoring_engine: Optional[MonitoringEngine] = None
        self.maintenance_scheduler: Optional[MaintenanceScheduler] = None
        self.alert_notifier: Optional[AlertNotifier] = None
        
    def setup(self) -> None:
        """Initialize all system components."""
        logger.info("Initializing Aircraft Tracking System...")
        
        # Sensor data collector
        self.sensor_collector = SensorDataCollector(self.config.mqtt)
        
        # Monitoring engine
        self.monitoring_engine = MonitoringEngine(self.config.alerts)
        
        # Maintenance scheduler
        self.maintenance_scheduler = MaintenanceScheduler(self.config.maintenance)
        
        # Alert notifier
        self.alert_notifier = AlertNotifier(self.config.alerts)
        
        # Wire up components
        self._connect_components()
        
        logger.info("System initialized successfully")
        
    def _connect_components(self) -> None:
        """Connect system components."""
        # Sensor readings -> Monitoring engine
        self.sensor_collector.register_callback(
            "*",  # All sensors
            self._on_sensor_reading
        )
        
        # Monitoring alerts -> Notifier
        self.monitoring_engine.register_alert_callback(
            self._on_alert
        )
        
    def _on_sensor_reading(self, reading) -> None:
        """Handle incoming sensor reading."""
        # Process through monitoring engine
        alert = self.monitoring_engine.process_reading(reading)
        
        # Log reading (automated logging)
        logger.debug(
            f"Sensor: {reading.sensor_type.value} | "
            f"Aircraft: {reading.aircraft_id} | "
            f"Value: {reading.value} {reading.unit}"
        )
        
    def _on_alert(self, alert) -> None:
        """Handle alert from monitoring engine."""
        # Send notifications asynchronously
        asyncio.create_task(self.alert_notifier.notify(alert))
        
    async def start(self) -> None:
        """Start the tracking system."""
        self.setup()
        self._running = True
        
        logger.info("Starting Aircraft Tracking System...")
        
        # Start sensor collection
        self.sensor_collector.start()
        
        # Start maintenance check loop
        asyncio.create_task(self._maintenance_check_loop())
        
        logger.info("System is running")
        
        # Keep running until stopped
        while self._running:
            await asyncio.sleep(1)
            
    async def _maintenance_check_loop(self) -> None:
        """Periodic maintenance check."""
        while self._running:
            # Check for overdue maintenance
            overdue = self.maintenance_scheduler.get_overdue_maintenance()
            for task in overdue:
                logger.warning(f"Overdue maintenance: {task.title} for {task.aircraft_id}")
                
            # Sleep for 1 hour
            await asyncio.sleep(3600)
            
    def stop(self) -> None:
        """Stop the tracking system."""
        logger.info("Stopping Aircraft Tracking System...")
        self._running = False
        
        if self.sensor_collector:
            self.sensor_collector.stop()
            
        logger.info("System stopped")


async def main():
    """Main entry point."""
    config = get_config()
    system = AircraftTrackingSystem(config)
    
    # Handle shutdown signals
    def handle_shutdown(signum, frame):
        logger.info("Shutdown signal received")
        system.stop()
        
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)
    
    await system.start()


if __name__ == "__main__":
    asyncio.run(main())
