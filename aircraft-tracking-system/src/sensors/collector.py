"""
Sensor Data Collector for Aircraft Tracking System.
Collects real-time data from aircraft sensors via MQTT.
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Callable, Dict, Any, Optional, List
import paho.mqtt.client as mqtt

from .models import SensorReading, SensorType, EngineData, FlightData
from config.settings import MQTTConfig


logger = logging.getLogger(__name__)


class SensorDataCollector:
    """
    Collects sensor data from aircraft via MQTT.
    Automated logging of aircraft performance data.
    """
    
    def __init__(self, config: MQTTConfig):
        self.config = config
        self.client: Optional[mqtt.Client] = None
        self.callbacks: Dict[str, List[Callable]] = {}
        self._connected = False
        self._readings_buffer: List[SensorReading] = []
        
    def connect(self) -> None:
        """Establish connection to MQTT broker."""
        self.client = mqtt.Client(client_id=self.config.client_id)
        
        if self.config.username:
            self.client.username_pw_set(
                self.config.username, 
                self.config.password
            )
        
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        
        logger.info(f"Connecting to MQTT broker at {self.config.broker_host}:{self.config.broker_port}")
        self.client.connect(
            self.config.broker_host,
            self.config.broker_port,
            keepalive=60
        )
        
    def _on_connect(self, client, userdata, flags, rc):
        """Handle successful connection."""
        if rc == 0:
            self._connected = True
            logger.info("Connected to MQTT broker")
            
            # Subscribe to sensor topics
            client.subscribe(self.config.sensor_topic)
            logger.info(f"Subscribed to {self.config.sensor_topic}")
        else:
            logger.error(f"Connection failed with code {rc}")
            
    def _on_disconnect(self, client, userdata, rc):
        """Handle disconnection."""
        self._connected = False
        logger.warning(f"Disconnected from MQTT broker (rc={rc})")
        
    def _on_message(self, client, userdata, msg):
        """Process incoming sensor data."""
        try:
            # Parse topic: aircraft/{aircraft_id}/sensors/{sensor_type}
            topic_parts = msg.topic.split("/")
            if len(topic_parts) >= 4:
                aircraft_id = topic_parts[1]
                sensor_type_str = topic_parts[3]
                
                payload = json.loads(msg.payload.decode())
                
                reading = self._parse_sensor_reading(
                    aircraft_id, 
                    sensor_type_str, 
                    payload
                )
                
                if reading:
                    self._process_reading(reading)
                    
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            
    def _parse_sensor_reading(
        self, 
        aircraft_id: str, 
        sensor_type_str: str, 
        payload: Dict[str, Any]
    ) -> Optional[SensorReading]:
        """Parse raw sensor data into SensorReading."""
        try:
            sensor_type = SensorType(sensor_type_str)
            
            return SensorReading(
                sensor_id=payload.get("sensor_id", f"{aircraft_id}_{sensor_type_str}"),
                sensor_type=sensor_type,
                aircraft_id=aircraft_id,
                value=float(payload["value"]),
                unit=payload.get("unit", ""),
                timestamp=datetime.fromisoformat(payload.get("timestamp", datetime.utcnow().isoformat())),
                metadata=payload.get("metadata", {}),
            )
        except (ValueError, KeyError) as e:
            logger.error(f"Failed to parse sensor reading: {e}")
            return None
            
    def _process_reading(self, reading: SensorReading) -> None:
        """Process and distribute sensor reading."""
        # Buffer reading for batch storage
        self._readings_buffer.append(reading)
        
        # Notify registered callbacks
        for callback in self.callbacks.get(reading.sensor_type.value, []):
            try:
                callback(reading)
            except Exception as e:
                logger.error(f"Callback error: {e}")
                
        # Notify all-sensors callbacks
        for callback in self.callbacks.get("*", []):
            try:
                callback(reading)
            except Exception as e:
                logger.error(f"Callback error: {e}")
                
    def register_callback(
        self, 
        sensor_type: str, 
        callback: Callable[[SensorReading], None]
    ) -> None:
        """Register callback for sensor data."""
        if sensor_type not in self.callbacks:
            self.callbacks[sensor_type] = []
        self.callbacks[sensor_type].append(callback)
        
    def get_buffered_readings(self) -> List[SensorReading]:
        """Get and clear buffered readings."""
        readings = self._readings_buffer.copy()
        self._readings_buffer.clear()
        return readings
        
    def start(self) -> None:
        """Start the data collector."""
        if not self.client:
            self.connect()
        self.client.loop_start()
        logger.info("Sensor data collector started")
        
    def stop(self) -> None:
        """Stop the data collector."""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
        logger.info("Sensor data collector stopped")
        
    @property
    def is_connected(self) -> bool:
        return self._connected
