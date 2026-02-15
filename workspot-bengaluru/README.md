# WORKSPOT BENGALURU

A hyper-local service booking platform built with Django (Backend) and React.js (Frontend).

## Features

- **User Authentication**: JWT-based secure authentication with role-based access (Customer, Provider, Admin)
- **Service Listings**: Browse and search services by category, location, and price
- **Booking System**: Complete booking workflow with status tracking
- **Provider Profiles**: Business profiles with ratings and reviews
- **Location-Based**: Hyper-local service discovery for Bengaluru
- **Optimized Performance**: PostgreSQL with indexed queries for concurrent requests

## Tech Stack

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT Authentication (SimpleJWT)
- CORS Headers

### Frontend
- React 18
- React Router v6
- TanStack Query (React Query)
- Zustand (State Management)
- Tailwind CSS
- Axios

## Project Structure

```
workspot-bengaluru/
├── backend/
│   ├── requirements.txt
│   └── workspot/
│       ├── settings.py
│       ├── urls.py
│       ├── api/
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── serializers.py
│       ├── users/
│       │   └── models.py
│       ├── services/
│       │   └── models.py
│       └── bookings/
│           └── models.py
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── components/
        ├── pages/
        ├── services/
        └── store/
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment (if not already active):
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Database Setup:
- By default, the project uses **SQLite** for development.
- **PostgreSQL** is optional. To use it, set `DB_ENGINE=django.db.backends.postgresql` in `.env`.

4. Run migrations:
```bash
python manage.py migrate
```

5. Create superuser (Optional, default admin created):
- Username: `admin`
- Password: `admin`
- Email: `admin@example.com`

6. Start the server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Set up environment variables:
```bash
# Create .env file
VITE_API_URL=http://localhost:8000/api
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token
- `POST /api/v1/auth/register/` - User registration
- `GET/PATCH /api/v1/auth/profile/` - User profile

### Services
- `GET /api/v1/services/` - List services
- `POST /api/v1/services/` - Create service (Provider)
- `GET /api/v1/services/{id}/` - Service details
- `GET /api/v1/services/nearby/` - Services near location

### Bookings
- `GET /api/v1/bookings/` - List bookings
- `POST /api/v1/bookings/` - Create booking
- `POST /api/v1/bookings/{id}/confirm/` - Confirm booking
- `POST /api/v1/bookings/{id}/complete/` - Complete booking

### Categories
- `GET /api/v1/categories/` - List categories

## Database Schema

### Key Models
- **User**: Custom user with roles, location, and profile
- **ProviderProfile**: Extended profile for service providers
- **Category**: Service categories (Plumbing, Electrical, etc.)
- **Service**: Service listings with pricing and duration
- **Booking**: Booking requests with status tracking
- **Review**: Customer reviews for completed bookings

## License

MIT License
