"""
Maintenance Scheduler for Aircraft Tracking System.
Automated logging of maintenance schedules and alerts for preventive actions.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import uuid

from config.settings import MaintenanceConfig


logger = logging.getLogger(__name__)


class MaintenanceType(Enum):
    """Types of aircraft maintenance checks."""
    A_CHECK = "a_check"  # Every 500 flight hours
    B_CHECK = "b_check"  # Every 2000 flight hours
    C_CHECK = "c_check"  # Every 6000 flight hours
    D_CHECK = "d_check"  # Every 25000 flight hours
    COMPONENT = "component"  # Component-specific maintenance
    UNSCHEDULED = "unscheduled"  # Unscheduled repairs


class MaintenanceStatus(Enum):
    """Status of maintenance tasks."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


@dataclass
class MaintenanceTask:
    """Individual maintenance task."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    aircraft_id: str = ""
    maintenance_type: MaintenanceType = MaintenanceType.A_CHECK
    title: str = ""
    description: str = ""
    status: MaintenanceStatus = MaintenanceStatus.SCHEDULED
    
    # Scheduling
    scheduled_date: Optional[datetime] = None
    due_flight_hours: Optional[float] = None
    
    # Execution
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    technician: Optional[str] = None
    notes: str = ""
    
    # Component info (for component maintenance)
    component_id: Optional[str] = None
    component_name: Optional[str] = None
    
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "aircraft_id": self.aircraft_id,
            "maintenance_type": self.maintenance_type.value,
            "title": self.title,
            "description": self.description,
            "status": self.status.value,
            "scheduled_date": self.scheduled_date.isoformat() if self.scheduled_date else None,
            "due_flight_hours": self.due_flight_hours,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "technician": self.technician,
            "notes": self.notes,
            "component_id": self.component_id,
            "component_name": self.component_name,
            "created_at": self.created_at.isoformat(),
        }


@dataclass
class AircraftStatus:
    """Aircraft operational status."""
    aircraft_id: str
    registration: str
    model: str
    total_flight_hours: float
    cycles: int  # Number of takeoff/landing cycles
    last_a_check: Optional[datetime] = None
    last_b_check: Optional[datetime] = None
    last_c_check: Optional[datetime] = None
    last_d_check: Optional[datetime] = None
    hours_since_a_check: float = 0
    hours_since_b_check: float = 0
    hours_since_c_check: float = 0
    hours_since_d_check: float = 0


class MaintenanceScheduler:
    """
    Automated maintenance scheduling and tracking.
    Improves operational safety and efficiency by reducing manual checks.
    """
    
    def __init__(self, config: MaintenanceConfig):
        self.config = config
        
        # In-memory storage (would use database in production)
        self._tasks: Dict[str, MaintenanceTask] = {}
        self._aircraft_status: Dict[str, AircraftStatus] = {}
        
        # Maintenance intervals (flight hours)
        self.check_intervals = {
            MaintenanceType.A_CHECK: config.a_check_hours,
            MaintenanceType.B_CHECK: config.b_check_hours,
            MaintenanceType.C_CHECK: config.c_check_hours,
            MaintenanceType.D_CHECK: config.d_check_hours,
        }
        
        # Component replacement intervals
        self.component_intervals = {
            "oil_filter": config.oil_filter_hours,
            "fuel_filter": config.fuel_filter_hours,
            "brake_pad": config.brake_pad_hours,
        }
        
    def register_aircraft(self, status: AircraftStatus) -> None:
        """Register aircraft for maintenance tracking."""
        self._aircraft_status[status.aircraft_id] = status
        logger.info(f"Registered aircraft {status.registration} for maintenance tracking")
        
    def update_flight_hours(self, aircraft_id: str, hours: float) -> List[MaintenanceTask]:
        """
        Update flight hours and check for due maintenance.
        Returns list of newly scheduled tasks.
        """
        status = self._aircraft_status.get(aircraft_id)
        if not status:
            logger.warning(f"Aircraft {aircraft_id} not registered")
            return []
            
        status.total_flight_hours = hours
        status.hours_since_a_check += hours - status.total_flight_hours
        status.hours_since_b_check += hours - status.total_flight_hours
        status.hours_since_c_check += hours - status.total_flight_hours
        status.hours_since_d_check += hours - status.total_flight_hours
        
        # Check for due maintenance
        new_tasks = self._check_scheduled_maintenance(status)
        
        return new_tasks
        
    def _check_scheduled_maintenance(self, status: AircraftStatus) -> List[MaintenanceTask]:
        """Check if any scheduled maintenance is due."""
        new_tasks = []
        
        checks = [
            (MaintenanceType.A_CHECK, status.hours_since_a_check),
            (MaintenanceType.B_CHECK, status.hours_since_b_check),
            (MaintenanceType.C_CHECK, status.hours_since_c_check),
            (MaintenanceType.D_CHECK, status.hours_since_d_check),
        ]
        
        for check_type, hours_since in checks:
            interval = self.check_intervals[check_type]
            
            # Check if approaching maintenance (within advance warning)
            remaining_hours = interval - hours_since
            estimated_days = remaining_hours / 8  # Assume 8 flight hours per day
            
            if estimated_days <= self.config.advance_warning_days:
                # Check if task already exists
                existing = self._get_pending_task(status.aircraft_id, check_type)
                
                if not existing:
                    task = MaintenanceTask(
                        aircraft_id=status.aircraft_id,
                        maintenance_type=check_type,
                        title=f"{check_type.value.upper().replace('_', ' ')} Due",
                        description=f"Scheduled {check_type.value} maintenance approaching. "
                                    f"Remaining: {remaining_hours:.1f} flight hours",
                        due_flight_hours=status.total_flight_hours + remaining_hours,
                        scheduled_date=datetime.utcnow() + timedelta(days=estimated_days),
                    )
                    self._tasks[task.id] = task
                    new_tasks.append(task)
                    
                    logger.info(
                        f"Scheduled {check_type.value} for aircraft {status.aircraft_id} "
                        f"at {task.due_flight_hours} hours"
                    )
                    
        return new_tasks
        
    def _get_pending_task(
        self, 
        aircraft_id: str, 
        maintenance_type: MaintenanceType
    ) -> Optional[MaintenanceTask]:
        """Get pending task of specific type for aircraft."""
        for task in self._tasks.values():
            if (task.aircraft_id == aircraft_id and 
                task.maintenance_type == maintenance_type and
                task.status in [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]):
                return task
        return None
        
    def create_task(self, task: MaintenanceTask) -> MaintenanceTask:
        """Create new maintenance task."""
        self._tasks[task.id] = task
        logger.info(f"Created maintenance task: {task.title}")
        return task
        
    def start_task(self, task_id: str, technician: str) -> Optional[MaintenanceTask]:
        """Start maintenance task."""
        task = self._tasks.get(task_id)
        if task:
            task.status = MaintenanceStatus.IN_PROGRESS
            task.started_at = datetime.utcnow()
            task.technician = technician
            logger.info(f"Started task {task_id} by {technician}")
        return task
        
    def complete_task(self, task_id: str, notes: str = "") -> Optional[MaintenanceTask]:
        """Complete maintenance task."""
        task = self._tasks.get(task_id)
        if task:
            task.status = MaintenanceStatus.COMPLETED
            task.completed_at = datetime.utcnow()
            task.notes = notes
            
            # Update aircraft status
            status = self._aircraft_status.get(task.aircraft_id)
            if status and task.maintenance_type in self.check_intervals:
                if task.maintenance_type == MaintenanceType.A_CHECK:
                    status.last_a_check = task.completed_at
                    status.hours_since_a_check = 0
                elif task.maintenance_type == MaintenanceType.B_CHECK:
                    status.last_b_check = task.completed_at
                    status.hours_since_b_check = 0
                elif task.maintenance_type == MaintenanceType.C_CHECK:
                    status.last_c_check = task.completed_at
                    status.hours_since_c_check = 0
                elif task.maintenance_type == MaintenanceType.D_CHECK:
                    status.last_d_check = task.completed_at
                    status.hours_since_d_check = 0
                    
            logger.info(f"Completed task {task_id}")
        return task
        
    def get_upcoming_maintenance(
        self, 
        aircraft_id: Optional[str] = None,
        days_ahead: int = 30
    ) -> List[MaintenanceTask]:
        """Get upcoming maintenance tasks."""
        cutoff = datetime.utcnow() + timedelta(days=days_ahead)
        
        tasks = [
            t for t in self._tasks.values()
            if t.status == MaintenanceStatus.SCHEDULED
            and (aircraft_id is None or t.aircraft_id == aircraft_id)
            and (t.scheduled_date is None or t.scheduled_date <= cutoff)
        ]
        
        return sorted(tasks, key=lambda t: t.scheduled_date or datetime.max)
        
    def get_overdue_maintenance(
        self, 
        aircraft_id: Optional[str] = None
    ) -> List[MaintenanceTask]:
        """Get overdue maintenance tasks."""
        now = datetime.utcnow()
        
        overdue = []
        for task in self._tasks.values():
            if task.status != MaintenanceStatus.SCHEDULED:
                continue
            if aircraft_id and task.aircraft_id != aircraft_id:
                continue
                
            if task.scheduled_date and task.scheduled_date < now:
                task.status = MaintenanceStatus.OVERDUE
                overdue.append(task)
                
        return overdue
