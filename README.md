# Smart Blind Glasses Monitoring System

A comprehensive monitoring system for smart glasses worn by visually impaired individuals, allowing caregivers to monitor their location and provide assistance when needed.

## Features

- **For Users**:
  - Real-time distance sensor data display
  - Emergency alert button
  - Text-to-speech warnings for obstacles
  - Connect with caregivers

- **For Caregivers**:
  - Monitor multiple users in real-time
  - View users' locations on a map
  - Receive emergency alerts
  - Access emergency history

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for email notifications

### Frontend
- React with Vite
- Material UI for components
- Leaflet for maps
- React Router for navigation

## Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd smart-glass-monitor
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `config.env` file in the `config` directory with the following variables:
```
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb://localhost:27017/smart-glass-monitor

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_password
FROM_EMAIL=noreply@smartglasses.com
FROM_NAME=Smart Glass Monitor
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register/user` - Register a new user
- `POST /api/v1/auth/register/caregiver` - Register a new caregiver
- `POST /api/v1/auth/login/user` - Login as a user
- `POST /api/v1/auth/login/caregiver` - Login as a caregiver
- `GET /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current logged in user
- `POST /api/v1/auth/forgotpassword/:role` - Request password reset
- `PUT /api/v1/auth/resetpassword/:role/:resettoken` - Reset password

### Users
- `GET /api/v1/users/:id` - Get a user
- `PUT /api/v1/users/:id` - Update a user
- `GET /api/v1/users/:id/caregivers` - Get a user's caregivers
- `PUT /api/v1/users/:id/caregivers/:caregiverId` - Add a caregiver to a user
- `DELETE /api/v1/users/:id/caregivers/:caregiverId` - Remove a caregiver from a user

### Caregivers
- `GET /api/v1/caregivers/:id` - Get a caregiver
- `PUT /api/v1/caregivers/:id` - Update a caregiver
- `GET /api/v1/caregivers/:id/users` - Get a caregiver's users

### Sensors
- `POST /api/v1/sensors/readings` - Submit sensor readings
- `GET /api/v1/sensors/readings/:userId` - Get sensor readings for a user
- `POST /api/v1/sensors/emergency` - Trigger an emergency alert
- `PUT /api/v1/sensors/emergency/:id/resolve` - Resolve an emergency alert
- `GET /api/v1/sensors/emergency/:userId` - Get emergency history for a user

## ESP32 Integration

This project includes simulated sensor data for development and testing. In a real-world scenario, you would integrate with an ESP32 microcontroller with:

1. An ultrasonic distance sensor
2. A GPS module
3. A button for emergency alerts

The ESP32 would then send data to the backend API endpoints.
