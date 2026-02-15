"""
Real-time Monitoring Engine for Aircraft Tracking System.
Monitors sensor data and detects anomalies for early fault detection.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable
from collections import defaultdict
import numpy as np

from src.sensors.models import (
    SensorReading, SensorType, Alert, AlertSeverity
)
from config.settings import AlertConfig


logger = logging.getLogger(__name__)


class MonitoringEngine:
    """
    Real-time monitoring and anomaly detection engine.
    Enables early fault detection and improves operational safety.
    """
    
    def __init__(self, alert_config: AlertConfig):
        self.config = alert_config
        self.alert_callbacks: List[Callable[[Alert], None]] = []
        
        # Historical data for trend analysis
        self._sensor_history: Dict[str, List[SensorReading]] = defaultdict(list)
        self._history_window = timedelta(hours=24)
        
        # Active alerts
        self._active_alerts: Dict[str, Alert] = {}
        
        # Threshold configuration
        self._thresholds = self._setup_thresholds()
        
    def _setup_thresholds(self) -> Dict[SensorType, Dict[str, float]]:
        """Configure monitoring thresholds."""
        return {
            SensorType.ENGINE_TEMP: {
                "warning": self.config.engine_temp_warning,
                "critical": self.config.engine_temp_critical,
            },
            SensorType.OIL_PRESSURE: {
                "low_warning": self.config.oil_pressure_low,
                "low_critical": self.config.oil_pressure_critical,
            },
            SensorType.HYDRAULIC_PRESSURE: {
                "low_warning": self.config.hydraulic_pressure_low,
            },
            SensorType.VIBRATION: {
                "warning": self.config.vibration_warning,
                "critical": self.config.vibration_critical,
            },
            SensorType.FUEL_LEVEL: {
                "low_warning": self.config.fuel_low,
                "low_critical": self.config.fuel_critical,
            },
        }
        
    def process_reading(self, reading: SensorReading) -> Optional[Alert]:
        """
        Process sensor reading and check for anomalies.
        Returns Alert if threshold exceeded.
        """
        # Store in history
        key = f"{reading.aircraft_id}_{reading.sensor_type.value}"
        self._sensor_history[key].append(reading)
        self._cleanup_history(key)
        
        # Check thresholds
        alert = self._check_thresholds(reading)
        if alert:
            self._handle_alert(alert)
            return alert
            
        # Check for anomalies using statistical analysis
        anomaly_alert = self._detect_anomaly(reading)
        if anomaly_alert:
            self._handle_alert(anomaly_alert)
            return anomaly_alert
            
        return None
        
    def _check_thresholds(self, reading: SensorReading) -> Optional[Alert]:
        """Check if reading exceeds defined thresholds."""
        thresholds = self._thresholds.get(reading.sensor_type)
        if not thresholds:
            return None
            
        sensor_type = reading.sensor_type
        value = reading.value
        
        # High value thresholds (temperature, vibration)
        if "critical" in thresholds and value >= thresholds["critical"]:
            return Alert(
                aircraft_id=reading.aircraft_id,
                sensor_type=sensor_type,
                severity=AlertSeverity.CRITICAL,
                title=f"Critical {sensor_type.value} Alert",
                message=f"{sensor_type.value} has reached critical level: {value:.2f} {reading.unit}",
                value=value,
                threshold=thresholds["critical"],
            )
            
        if "warning" in thresholds and value >= thresholds["warning"]:
            return Alert(
                aircraft_id=reading.aircraft_id,
                sensor_type=sensor_type,
                severity=AlertSeverity.WARNING,
                title=f"{sensor_type.value} Warning",
                message=f"{sensor_type.value} is elevated: {value:.2f} {reading.unit}",
                value=value,
                threshold=thresholds["warning"],
            )
            
        # Low value thresholds (pressure, fuel)
        if "low_critical" in thresholds and value <= thresholds["low_critical"]:
            return Alert(
                aircraft_id=reading.aircraft_id,
                sensor_type=sensor_type,
                severity=AlertSeverity.CRITICAL,
                title=f"Critical Low {sensor_type.value}",
                message=f"{sensor_type.value} critically low: {value:.2f} {reading.unit}",
                value=value,
                threshold=thresholds["low_critical"],
            )
            
        if "low_warning" in thresholds and value <= thresholds["low_warning"]:
            return Alert(
                aircraft_id=reading.aircraft_id,
                sensor_type=sensor_type,
                severity=AlertSeverity.WARNING,
                title=f"Low {sensor_type.value} Warning",
                message=f"{sensor_type.value} is low: {value:.2f} {reading.unit}",
                value=value,
                threshold=thresholds["low_warning"],
            )
            
        return None
        
    def _detect_anomaly(self, reading: SensorReading) -> Optional[Alert]:
        """
        Detect anomalies using statistical analysis.
        Enables early fault detection through trend analysis.
        """
        key = f"{reading.aircraft_id}_{reading.sensor_type.value}"
        history = self._sensor_history[key]
        
        if len(history) < 30:  # Need minimum data points
            return None
            
        # Calculate statistics
        values = [r.value for r in history[-100:]]  # Last 100 readings
        mean = np.mean(values)
        std = np.std(values)
        
        if std == 0:
            return None
            
        # Z-score anomaly detection
        z_score = abs(reading.value - mean) / std
        
        if z_score > 3.5:  # Strong anomaly
            return Alert(
                aircraft_id=reading.aircraft_id,
                sensor_type=reading.sensor_type,
                severity=AlertSeverity.WARNING,
                title=f"Anomaly Detected: {reading.sensor_type.value}",
                message=f"Unusual reading detected. Value: {reading.value:.2f}, Expected range: {mean:.2f} ± {2*std:.2f}",
                value=reading.value,
                threshold=mean + 2 * std,
            )
            
        # Trend detection - rapid change
        if len(history) >= 10:
            recent = [r.value for r in history[-10:]]
            trend = (recent[-1] - recent[0]) / len(recent)
            
            # Alert on rapid increase/decrease
            if abs(trend) > std * 0.5:
                direction = "increasing" if trend > 0 else "decreasing"
                return Alert(
                    aircraft_id=reading.aircraft_id,
                    sensor_type=reading.sensor_type,
                    severity=AlertSeverity.INFO,
                    title=f"Trend Alert: {reading.sensor_type.value}",
                    message=f"{reading.sensor_type.value} is rapidly {direction}. Monitor closely.",
                    value=reading.value,
                )
                
        return None
        
    def _cleanup_history(self, key: str) -> None:
        """Remove old readings from history."""
        cutoff = datetime.utcnow() - self._history_window
        self._sensor_history[key] = [
            r for r in self._sensor_history[key]
            if r.timestamp > cutoff
        ]
        
    def _handle_alert(self, alert: Alert) -> None:
        """Handle new alert."""
        # Store active alert
        alert_key = f"{alert.aircraft_id}_{alert.sensor_type.value if alert.sensor_type else 'general'}"
        self._active_alerts[alert_key] = alert
        
        # Notify callbacks
        for callback in self.alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                logger.error(f"Alert callback error: {e}")
                
        logger.warning(
            f"Alert: [{alert.severity.value.upper()}] {alert.title} - {alert.message}"
        )
        
    def register_alert_callback(self, callback: Callable[[Alert], None]) -> None:
        """Register callback for alerts."""
        self.alert_callbacks.append(callback)
        
    def get_active_alerts(self, aircraft_id: Optional[str] = None) -> List[Alert]:
        """Get active (unresolved) alerts."""
        alerts = list(self._active_alerts.values())
        if aircraft_id:
            alerts = [a for a in alerts if a.aircraft_id == aircraft_id]
        return [a for a in alerts if not a.resolved]
        
    def resolve_alert(self, alert_id: str) -> bool:
        """Mark alert as resolved."""
        for key, alert in self._active_alerts.items():
            if alert.id == alert_id:
                alert.resolved = True
                alert.resolved_at = datetime.utcnow()
                return True
        return False
