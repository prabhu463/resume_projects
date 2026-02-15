"""
FastAPI REST API for Aircraft Tracking and Maintenance System.
Provides endpoints for monitoring, alerts, and maintenance management.
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncio
import json

from src.sensors.models import Alert, AlertSeverity
from src.maintenance.scheduler import (
    MaintenanceTask, MaintenanceType, MaintenanceStatus, AircraftStatus
)


app = FastAPI(
    title="Aircraft Tracking & Maintenance System",
    description="Real-time monitoring and maintenance tracking API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections for real-time updates
websocket_connections: List[WebSocket] = []


# Pydantic models
class AircraftStatusCreate(BaseModel):
    aircraft_id: str
    registration: str
    model: str
    total_flight_hours: float
    cycles: int


class MaintenanceTaskCreate(BaseModel):
    aircraft_id: str
    maintenance_type: str
    title: str
    description: str
    scheduled_date: Optional[datetime] = None
    component_id: Optional[str] = None
    component_name: Optional[str] = None


class MaintenanceTaskUpdate(BaseModel):
    status: Optional[str] = None
    technician: Optional[str] = None
    notes: Optional[str] = None


class AlertAcknowledge(BaseModel):
    acknowledged_by: str


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Aircraft endpoints
@app.post("/api/v1/aircraft", response_model=dict)
async def register_aircraft(aircraft: AircraftStatusCreate):
    """Register new aircraft for tracking."""
    # In production, this would save to database
    return {"message": f"Aircraft {aircraft.registration} registered", "data": aircraft.dict()}


@app.get("/api/v1/aircraft/{aircraft_id}/status")
async def get_aircraft_status(aircraft_id: str):
    """Get aircraft operational status."""
    # Mock response - would fetch from database
    return {
        "aircraft_id": aircraft_id,
        "total_flight_hours": 12500.5,
        "cycles": 8420,
        "hours_since_last_a_check": 245.5,
        "next_maintenance": "A-Check in 254.5 hours"
    }


# Monitoring endpoints
@app.get("/api/v1/monitoring/alerts")
async def get_alerts(
    aircraft_id: Optional[str] = None,
    severity: Optional[str] = None,
    resolved: bool = False
):
    """Get system alerts."""
    # Mock response
    alerts = [
        {
            "id": "alert-001",
            "aircraft_id": aircraft_id or "AC-001",
            "severity": severity or "warning",
            "title": "Engine Temperature Elevated",
            "message": "Engine 1 temperature is above normal operating range",
            "resolved": resolved,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    return {"alerts": alerts, "count": len(alerts)}


@app.post("/api/v1/monitoring/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, data: AlertAcknowledge):
    """Acknowledge an alert."""
    return {
        "message": f"Alert {alert_id} acknowledged",
        "acknowledged_by": data.acknowledged_by,
        "acknowledged_at": datetime.utcnow().isoformat()
    }


@app.post("/api/v1/monitoring/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Resolve an alert."""
    return {
        "message": f"Alert {alert_id} resolved",
        "resolved_at": datetime.utcnow().isoformat()
    }


# Maintenance endpoints
@app.get("/api/v1/maintenance/tasks")
async def get_maintenance_tasks(
    aircraft_id: Optional[str] = None,
    status: Optional[str] = None,
    maintenance_type: Optional[str] = None
):
    """Get maintenance tasks."""
    # Mock response
    tasks = [
        {
            "id": "task-001",
            "aircraft_id": aircraft_id or "AC-001",
            "maintenance_type": maintenance_type or "a_check",
            "title": "A-Check Due",
            "status": status or "scheduled",
            "scheduled_date": datetime.utcnow().isoformat(),
            "due_flight_hours": 13000.0
        }
    ]
    return {"tasks": tasks, "count": len(tasks)}


@app.post("/api/v1/maintenance/tasks", response_model=dict)
async def create_maintenance_task(task: MaintenanceTaskCreate):
    """Create new maintenance task."""
    task_id = f"task-{datetime.utcnow().timestamp()}"
    return {
        "message": "Maintenance task created",
        "task_id": task_id,
        "data": task.dict()
    }


@app.patch("/api/v1/maintenance/tasks/{task_id}")
async def update_maintenance_task(task_id: str, update: MaintenanceTaskUpdate):
    """Update maintenance task."""
    return {
        "message": f"Task {task_id} updated",
        "updates": update.dict(exclude_none=True)
    }


@app.get("/api/v1/maintenance/upcoming")
async def get_upcoming_maintenance(days: int = 30, aircraft_id: Optional[str] = None):
    """Get upcoming scheduled maintenance."""
    return {
        "upcoming": [],
        "period_days": days,
        "aircraft_id": aircraft_id
    }


@app.get("/api/v1/maintenance/overdue")
async def get_overdue_maintenance(aircraft_id: Optional[str] = None):
    """Get overdue maintenance tasks."""
    return {
        "overdue": [],
        "aircraft_id": aircraft_id
    }


# Real-time WebSocket endpoint
@app.websocket("/ws/monitoring/{aircraft_id}")
async def monitoring_websocket(websocket: WebSocket, aircraft_id: str):
    """WebSocket for real-time sensor data and alerts."""
    await websocket.accept()
    websocket_connections.append(websocket)
    
    try:
        while True:
            # Send mock real-time data every second
            data = {
                "type": "sensor_data",
                "aircraft_id": aircraft_id,
                "timestamp": datetime.utcnow().isoformat(),
                "sensors": {
                    "engine_temp": 78.5,
                    "oil_pressure": 45.2,
                    "fuel_level": 65.0,
                    "altitude": 35000,
                    "airspeed": 480
                }
            }
            await websocket.send_json(data)
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        websocket_connections.remove(websocket)


# Broadcast alert to all connected clients
async def broadcast_alert(alert: dict):
    """Broadcast alert to all WebSocket connections."""
    for connection in websocket_connections:
        try:
            await connection.send_json({"type": "alert", "data": alert})
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
