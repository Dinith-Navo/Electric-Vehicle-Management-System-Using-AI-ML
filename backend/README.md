# EV Management Backend — Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

## Quick Start

1. **Install dependencies** (already done)
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   Edit `backend/.env` and set your **MongoDB Atlas connection string** and a strong **JWT_SECRET**:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ev_management
   JWT_SECRET=change_this_to_a_long_random_string
   ```

3. **Start in development mode**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000`

4. **Health check**
   ```
   GET http://localhost:5000/health
   ```

---

## API Reference

### Auth  (`/api/auth`)
| Method | Path          | Auth | Description              |
|--------|---------------|------|--------------------------|
| POST   | `/register`   | ❌    | Register new user         |
| POST   | `/login`      | ❌    | Login, receive JWT tokens |
| POST   | `/refresh`    | ❌    | Rotate refresh token      |
| POST   | `/logout`     | ✅    | Invalidate refresh token  |
| GET    | `/me`         | ✅    | Get current user info     |

### Vehicles (`/api/vehicles`)
| Method | Path     | Auth | Description           |
|--------|----------|------|-----------------------|
| GET    | `/`      | ✅    | List user's vehicles  |
| POST   | `/`      | ✅    | Add a vehicle         |
| GET    | `/:id`   | ✅    | Get single vehicle    |
| PUT    | `/:id`   | ✅    | Update vehicle        |
| DELETE | `/:id`   | ✅    | Soft-delete vehicle   |

### Telemetry (`/api/telemetry`)
| Method | Path       | Auth | Description                      |
|--------|------------|------|----------------------------------|
| GET    | `/`        | ✅    | Latest telemetry snapshot        |
| GET    | `/history` | ✅    | Historical data (query: `days`)  |
| POST   | `/`        | ✅    | Ingest new telemetry snapshot    |

### Predictions (`/api/predictions`)
| Method | Path      | Auth | Description                    |
|--------|-----------|------|--------------------------------|
| POST   | `/`       | ✅    | Run AI battery health analysis |
| GET    | `/`       | ✅    | Prediction history             |
| GET    | `/latest` | ✅    | Most recent prediction         |

### Notifications (`/api/notifications`)
| Method | Path            | Auth | Description             |
|--------|-----------------|------|-------------------------|
| GET    | `/`             | ✅    | All notifications        |
| PATCH  | `/:id/read`     | ✅    | Mark one as read         |
| PATCH  | `/read-all`     | ✅    | Mark all as read         |
| DELETE | `/:id`          | ✅    | Delete one               |
| DELETE | `/`             | ✅    | Clear all                |

### User Profile (`/api/users`)
| Method | Path           | Auth | Description          |
|--------|----------------|------|----------------------|
| GET    | `/me`          | ✅    | Get profile          |
| PUT    | `/me`          | ✅    | Update profile       |
| PUT    | `/me/password` | ✅    | Change password      |
| DELETE | `/me`          | ✅    | Deactivate account   |

---

## Socket.IO Events

Connect to: `ws://localhost:5000`

**Client → Server:**
```js
socket.emit('authenticate', { token: '<JWT>', vehicleId: '<optional>' });
socket.emit('telemetry_ping');  // heartbeat
```

**Server → Client:**
```js
socket.on('connection_confirmed', (data) => ...);
socket.on('telemetry_update', (telemetry) => ...);   // every 3 seconds
socket.on('prediction_update', (prediction) => ...); // periodic AI results
socket.on('new_notification', (notification) => ...); // critical alerts
```
