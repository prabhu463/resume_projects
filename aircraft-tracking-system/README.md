# Aircraft Tracking and Maintenance System

A real-time monitoring and maintenance tracking solution for aircraft using embedded systems and Python.

## Features

- **Real-Time Monitoring**: Live sensor data collection via MQTT protocol
- **Automated Performance Logging**: Continuous logging of aircraft performance metrics
- **Maintenance Scheduling**: Automated tracking of A/B/C/D checks and component replacements
- **Alert System**: Multi-channel notifications (Telegram, SMS, Webhooks) for preventive actions
- **Early Fault Detection**: Statistical anomaly detection using Z-score and trend analysis
- **REST API**: FastAPI-based API for integration with external systems
- **WebSocket Support**: Real-time data streaming to dashboards

## Tech Stack

- **Backend**: Python 3.10+, FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Message Broker**: MQTT (Paho MQTT)
- **Real-Time**: WebSockets
- **Data Processing**: NumPy, Pandas
- **Notifications**: Telegram Bot API, Twilio SMS

## Project Structure

```
aircraft-tracking-system/
├── config/
│   └── settings.py          # Configuration management
├── src/
│   ├── main.py              # Application entry point
│   ├── api/
│   │   └── main.py          # FastAPI REST API
│   ├── sensors/
│   │   ├── models.py        # Data models
│   │   └── collector.py     # MQTT data collector
│   ├── monitoring/
│   │   └── engine.py        # Anomaly detection engine
│   ├── maintenance/
│   │   └── scheduler.py     # Maintenance scheduler
│   └── alerts/
│       └── notifier.py      # Multi-channel notifications
├── tests/
├── requirements.txt
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- PostgreSQL 14+
- MQTT Broker (Mosquitto recommended)

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Create .env file
DEBUG=True
LOG_LEVEL=INFO

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aircraft_tracking
DB_USER=postgres
DB_PASSWORD=your-password

# MQTT
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USER=
MQTT_PASSWORD=

# Notifications (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
ALERT_PHONE_NUMBER=+1234567890

# API
API_HOST=0.0.0.0
API_PORT=8000
```

4. Create database:
```sql
CREATE DATABASE aircraft_tracking;
```

5. Run the application:
```bash
# Start the monitoring system
python -m src.main

# Or start the API server
uvicorn src.api.main:app --reload
```

## API Endpoints

### Aircraft Management
- `POST /api/v1/aircraft` - Register aircraft
- `GET /api/v1/aircraft/{id}/status` - Get aircraft status

### Monitoring
- `GET /api/v1/monitoring/alerts` - Get system alerts
- `POST /api/v1/monitoring/alerts/{id}/acknowledge` - Acknowledge alert
- `POST /api/v1/monitoring/alerts/{id}/resolve` - Resolve alert

### Maintenance
- `GET /api/v1/maintenance/tasks` - Get maintenance tasks
- `POST /api/v1/maintenance/tasks` - Create task
- `PATCH /api/v1/maintenance/tasks/{id}` - Update task
- `GET /api/v1/maintenance/upcoming` - Upcoming maintenance
- `GET /api/v1/maintenance/overdue` - Overdue maintenance

### WebSocket
- `WS /ws/monitoring/{aircraft_id}` - Real-time sensor data

## Sensor Types

| Sensor | Unit | Warning | Critical |
|--------|------|---------|----------|
| Engine Temperature | °C | 85 | 95 |
| Oil Pressure | PSI | <25 | <15 |
| Hydraulic Pressure | PSI | <2800 | - |
| Vibration | mm/s | 4.5 | 7.1 |
| Fuel Level | % | <20 | <10 |

## Maintenance Schedule

| Check Type | Interval (Flight Hours) |
|------------|-------------------------|
| A-Check | 500 |
| B-Check | 2,000 |
| C-Check | 6,000 |
| D-Check | 25,000 |

## MQTT Topics

```
aircraft/{aircraft_id}/sensors/{sensor_type}
aircraft/{aircraft_id}/alerts
aircraft/{aircraft_id}/maintenance
```

### Sensor Data Format
```json
{
  "sensor_id": "AC001-ENG1-TEMP",
  "value": 78.5,
  "unit": "celsius",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "engine_number": 1
  }
}
```

## Anomaly Detection

The system uses statistical analysis for early fault detection:

1. **Threshold Monitoring**: Immediate alerts when values exceed limits
2. **Z-Score Analysis**: Detects values >3.5 standard deviations from mean
3. **Trend Detection**: Identifies rapid increases/decreases in sensor values

## Alert Severity Levels

- **INFO**: Trend changes, non-critical updates
- **WARNING**: Values approaching thresholds
- **CRITICAL**: Values exceeding critical thresholds
- **EMERGENCY**: Immediate action required

## License

MIT License
