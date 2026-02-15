"""
Sensor data models for Aircraft Tracking System.
Defines data structures for various aircraft sensors.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
import uuid


class SensorType(Enum):
    """Types of sensors in the aircraft."""
    ENGINE_TEMP = "engine_temperature"
    OIL_PRESSURE = "oil_pressure"
    FUEL_LEVEL = "fuel_level"
    HYDRAULIC_PRESSURE = "hydraulic_pressure"
    VIBRATION = "vibration"
    ALTITUDE = "altitude"
    AIRSPEED = "airspeed"
    GPS = "gps"
    LANDING_GEAR = "landing_gear"
    BRAKE_TEMP = "brake_temperature"


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class SensorReading:
    """Individual sensor reading."""
    sensor_id: str
    sensor_type: SensorType
    aircraft_id: str
    value: float
    unit: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "sensor_id": self.sensor_id,
            "sensor_type": self.sensor_type.value,
            "aircraft_id": self.aircraft_id,
            "value": self.value,
            "unit": self.unit,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class EngineData:
    """Engine performance data."""
    aircraft_id: str
    engine_number: int
    temperature: float  # Celsius
    rpm: float
    oil_pressure: float  # PSI
    oil_temperature: float  # Celsius
    fuel_flow: float  # kg/h
    vibration: float  # mm/s
    egt: float  # Exhaust Gas Temperature
    n1: float  # Fan speed percentage
    n2: float  # Core speed percentage
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class FlightData:
    """Real-time flight data."""
    aircraft_id: str
    altitude: float  # feet
    airspeed: float  # knots
    ground_speed: float  # knots
    heading: float  # degrees
    vertical_speed: float  # feet/min
    latitude: float
    longitude: float
    fuel_remaining: float  # percentage
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Alert:
    """System alert."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    aircraft_id: str = ""
    sensor_type: Optional[SensorType] = None
    severity: AlertSeverity = AlertSeverity.INFO
    title: str = ""
    message: str = ""
    value: Optional[float] = None
    threshold: Optional[float] = None
    acknowledged: bool = False
    resolved: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "aircraft_id": self.aircraft_id,
            "sensor_type": self.sensor_type.value if self.sensor_type else None,
            "severity": self.severity.value,
            "title": self.title,
            "message": self.message,
            "value": self.value,
            "threshold": self.threshold,
            "acknowledged": self.acknowledged,
            "resolved": self.resolved,
            "created_at": self.created_at.isoformat(),
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }
