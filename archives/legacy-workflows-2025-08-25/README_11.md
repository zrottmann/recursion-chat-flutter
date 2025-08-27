# Trading Post Frontend

React-based frontend for the Trading Post application - a local community trading platform with AI-powered matching.

## Features

- User authentication with JWT tokens
- Profile management with opt-in for AI matching
- Listing management (create, edit, delete)
- AI-powered match suggestions with scoring
- Geographic search with interactive maps
- Real-time chat negotiation (WebSocket stub)
- Responsive design with Bootstrap

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will run on http://localhost:3000

## Backend Integration

This frontend expects a backend API running on http://localhost:8000 with the following endpoints:
- `/auth/login` - User authentication
- `/users/me` - User profile management
- `/listings` - Listing CRUD operations
- `/matches` - AI-powered matches
- `/search` - Geographic search
- WebSocket at `ws://localhost:8000/chat` for negotiations

## Project Structure

```
src/
├── components/        # React components
├── hooks/            # Custom React hooks
├── services/         # API and WebSocket services
├── store/            # Redux store and slices
└── App.js           # Main app component
```

## Technologies Used

- React 19
- Redux Toolkit for state management
- React Router v6 for routing
- React Bootstrap for UI components
- React Leaflet for maps
- React Hook Form + Yup for form validation
- Axios for API requests
- WebSocket for real-time communication