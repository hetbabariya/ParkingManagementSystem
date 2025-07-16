# Parking Reservation System

## Frontend (Bootstrap UI)
A simple, user-friendly frontend is provided in the `frontend/` folder. Open `frontend/index.html` in your browser. Make sure the Flask backend is running (by default on http://127.0.0.1:5000) for the frontend to work.

# Vehicle Parking System – Backend Documentation

## API Endpoint Summary

| Method | Endpoint                                             | Description                                      |
|--------|------------------------------------------------------|--------------------------------------------------|
| POST   | /auth/register                                      | Register a new user                              |
| POST   | /auth/login                                         | Login (user or admin)                            |
| POST   | /auth/logout                                        | Logout                                           |
| GET    | /admin/lots                                         | List all parking lots (admin)                    |
| POST   | /admin/lots                                         | Create a new parking lot (admin)                 |
| PUT    | /admin/lots/<lot_id>                                | Edit a parking lot (admin)                       |
| DELETE | /admin/lots/<lot_id>                                | Delete a parking lot (admin)                     |
| GET    | /admin/lots/<lot_id>/spots                          | List all spots in a lot (admin)                  |
| GET    | /admin/lots/<lot_id>/slots/<spot_id>/summary        | Get slot summary (admin)                         |
| DELETE | /admin/lots/<lot_id>/slots/<spot_id>                | Delete a spot (admin)                            |
| GET    | /admin/users                                        | List all users (admin)                           |
| GET    | /admin/users/<user_id>                              | Get user by ID (admin)                           |
| GET    | /lots/search                                        | Search lots by location and/or pincode           |
| GET    | /admin/summary/occupancy                            | Occupancy summary for all lots (admin)           |
| GET    | /admin/summary/revenue                              | Revenue summary for all lots (admin)             |
| GET    | /user/lots                                          | List all parking lots (user)                     |
| POST   | /user/lots/<lot_id>/book                            | Book a spot in a lot (user)                      |
| GET    | /user/reservations/<reservation_id>/release-summary | Show release summary for a reservation (user)    |
| POST   | /user/reservations/<reservation_id>/release         | Release a spot (user)                            |
| GET    | /user/history                                       | View booking history (user)                      |
| GET    | /user/summary                                       | User summary for charts (user)                   |

---







## Table of Contents
- [Vehicle Parking System – Backend Documentation](#vehicle-parking-system--backend-documentation)
  - [API Endpoint Summary](#api-endpoint-summary)
  - [Table of Contents](#table-of-contents)
  - [1. Project Overview](#1-project-overview)
  - [2. Technology Stack](#2-technology-stack)
  - [3. Project Structure \& File Descriptions](#3-project-structure--file-descriptions)
  - [4. How to Set Up and Run the Project](#4-how-to-set-up-and-run-the-project)
  - [5. Database Models](#5-database-models)
  - [6. Authentication \& Roles](#6-authentication--roles)
  - [7. API Endpoints (with Examples)](#7-api-endpoints-with-examples)
    - [Authentication](#authentication)
      - [Register User](#register-user)
      - [Login](#login)
      - [Logout](#logout)
    - [Admin](#admin)
      - [Create a New Parking Lot](#create-a-new-parking-lot)
      - [Edit a Parking Lot](#edit-a-parking-lot)
      - [Delete a Parking Lot](#delete-a-parking-lot)
      - [List All Parking Lots](#list-all-parking-lots)
      - [List All Spots in a Lot](#list-all-spots-in-a-lot)
      - [Get Slot Summary (Cost/Duration)](#get-slot-summary-costduration)
      - [Delete a Spot](#delete-a-spot)
      - [List All Users](#list-all-users)
      - [Get User by ID](#get-user-by-id)
      - [Search Lots by Location and/or Pincode](#search-lots-by-location-andor-pincode)
      - [Admin Summary: Occupancy](#admin-summary-occupancy)
      - [Admin Summary: Revenue](#admin-summary-revenue)
    - [User](#user)
      - [Register User](#register-user-1)
      - [Book a Spot](#book-a-spot)
      - [Show Release Summary](#show-release-summary)
      - [Release a Spot](#release-a-spot)
      - [View Booking History](#view-booking-history)
      - [User Summary (for Charts)](#user-summary-for-charts)
  - [8. Business Logic \& Features](#8-business-logic--features)
  - [9. Time Zone Handling](#9-time-zone-handling)
  - [10. Postman Collection](#10-postman-collection)
  - [11. Contact](#11-contact)

---

## 1. Project Overview
This backend system manages parking lots, spots, users, and reservations. It supports two roles: **Admin** (superuser) and **User** (customer). The system allows for parking lot and spot management, user registration and booking, real-time status, and summary statistics for both admin and users.

---

## 2. Technology Stack
- **Language:** Python 3.x
- **Framework:** Flask
- **Database:** SQLite (via SQLAlchemy ORM)
- **Time Zone:** Indian Standard Time (IST)
- **Other:** Werkzeug (for password hashing), pytz (for timezone handling)

---

## 3. Project Structure & File Descriptions
```
app/
  models.py         # Database models for users, lots, spots, reservations
  __init__.py       # App factory, blueprint registration
  config.py         # Configuration (DB URI, secret key)
  routes/
    admin.py        # Admin endpoints (lot/spot/user management, summaries)
    user.py         # User endpoints (booking, releasing, history, summary)
    auth.py         # Authentication endpoints (register, login, logout)
requirements.txt    # Python dependencies for pip install
run.py              # Main entry point to start the Flask server
init_db.py          # Script to initialize the database and seed admin
```

**File Descriptions:**
- **models.py**: Defines all database tables and relationships.
- **__init__.py**: Sets up the Flask app, loads config, and registers all routes.
- **config.py**: Stores configuration like database URI and secret key.
- **routes/admin.py**: All admin-only endpoints (manage lots, spots, users, view summaries).
- **routes/user.py**: All user-only endpoints (book, release, view history, summary).
- **routes/auth.py**: Endpoints for user registration, login, and logout.
- **requirements.txt**: Lists all required Python packages.
- **run.py**: Starts the Flask server.
- **init_db.py**: Initializes the database and creates the admin user.

---

## 4. How to Set Up and Run the Project
1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Initialize the database:**
   ```bash
   python init_db.py
   ```
   (This will also create the admin user.)
3. **Run the server:**
   ```bash
   python run.py
   ```
4. **API is available at:**  
   `http://localhost:5000/`

---

## 5. Database Models
- **Account:**  
  - `account_id` (int, PK)
  - `email_address` (string, unique, required)
  - `pwd_hash` (string, required)
  - `full_name` (string)
  - `address` (string)
  - `postal_code` (string)
  - `role` (string: 'admin' or 'user', required)
- **Lot:**  
  - `lot_id` (int, PK)
  - `lot_name` (string, unique, required)
  - `lot_location` (string, required)
  - `pincode` (string, required)
  - `hourly_rate` (float, required)
  - `total_spots` (int, required)
- **Spot:**  
  - `spot_id` (int, PK)
  - `lot_id` (int, FK to Lot, required)
  - `identifier` (int, required)
  - `availability` (string: 'available' or 'occupied', required)
  - `active_reservation` (int, FK to Reservation, nullable)
- **Reservation:**  
  - `reservation_id` (int, PK)
  - `account_id` (int, FK to Account, required)
  - `spot_id` (int, FK to Spot, required)
  - `vehicle_number` (string, required)
  - `checkin_time` (datetime, required)
  - `checkout_time` (datetime, nullable)
  - `reservation_status` (string: 'active' or 'released', required)

---

## 6. Authentication & Roles
- **User:** Registers and logs in via `/auth/register` and `/auth/login`.
- **Admin:** Seeded in the database, logs in via `/auth/login` (no registration).
- **Session-based authentication** (Flask session).

---

## 7. API Endpoints (with Examples)
### Authentication
#### Register User
- **POST** `/auth/register`
- **Input:**
  ```json
  {
    "email_address": "user@email.com",
    "password": "yourpassword",
    "full_name": "User Name",
    "address": "User Address",
    "postal_code": "123456"
  }
  ```
- **Output:** `{ "message": "Registration successful." }`

#### Login
- **POST** `/auth/login`
- **Input:**
  ```json
  {
    "email_address": "user@email.com",
    "password": "yourpassword"
  }
  ```
- **Output:** `{ "message": "Login successful.", "role": "user" }`

#### Logout
- **POST** `/auth/logout`
- **Output:** `{ "message": "Logged out successfully." }`

---

### Admin
#### Create a New Parking Lot
- **POST** `/admin/lots`
- **Input:**
  ```json
  {
    "lot_name": "Lot A",
    "lot_location": "Downtown",
    "pincode": "123456",
    "hourly_rate": 20,
    "total_spots": 10
  }
  ```
- **Output:** `{ "message": "Parking lot created successfully with spots." }`
- **Note:** `lot_name` must be unique.

#### Edit a Parking Lot
- **PUT** `/admin/lots/<lot_id>`
- **Input:** (any fields to update)
  ```json
  {
    "lot_name": "Lot B",
    "lot_location": "Downtown",
    "pincode": "123456",
    "hourly_rate": 25,
    "total_spots": 10
  }
  ```
- **Output:** `{ "message": "Parking lot updated successfully." }`

#### Delete a Parking Lot
- **DELETE** `/admin/lots/<lot_id>`
- **Output:** `{ "message": "Parking lot removed successfully." }`
- **Note:** Only possible if all spots in the lot are available.

#### List All Parking Lots
- **GET** `/admin/lots`
- **Output:**
  ```json
  {
    "lots": [
      {
        "lot_id": 1,
        "lot_name": "Lot A",
        "lot_location": "Downtown",
        "pincode": "123456",
        "hourly_rate": 20,
        "total_spots": 10,
        "occupied_spots": 3,
        "available_spots": 7
      }
    ]
  }
  ```

#### List All Spots in a Lot
- **GET** `/admin/lots/<lot_id>/spots`
- **Output:**
  ```json
  {
    "spots": [
      {
        "spot_id": 1,
        "identifier": 1,
        "availability": "available"
      }
    ]
  }
  ```

#### Get Slot Summary (Cost/Duration)
- **GET** `/admin/lots/<lot_id>/slots/<spot_id>/summary`
- **Output:** (if occupied)
  ```json
  {
    "spot_id": 1,
    "lot_id": 1,
    "identifier": 1,
    "vehicle_number": "GJ01AB1234",
    "checkin_time_ist": "2024-06-01 10:00:00",
    "current_time_ist": "2024-06-01 12:30:00",
    "duration_hours": 3,
    "hourly_rate": 20,
    "amount_due": 60,
    "status": "active"
  }
  ```

#### Delete a Spot
- **DELETE** `/admin/lots/<lot_id>/slots/<spot_id>`
- **Output:** `{ "message": "Spot deleted successfully and lot total_spots updated." }`
- **Note:** Only possible if the spot is not occupied.

#### List All Users
- **GET** `/admin/users`
- **Output:** List of all users (excluding admin).

#### Get User by ID
- **GET** `/admin/users/<user_id>`
- **Output:** User details.

#### Search Lots by Location and/or Pincode
- **GET** `/lots/search?location=Downtown&pincode=123456`
- **Output:** List of lots matching the search.

#### Admin Summary: Occupancy
- **GET** `/admin/summary/occupancy`
- **Output:**
  ```json
  {
    "occupancy": [
      {
        "lot_id": 1,
        "lot_name": "Lot A",
        "occupied": 3,
        "available": 7
      }
    ]
  }
  ```

#### Admin Summary: Revenue
- **GET** `/admin/summary/revenue`
- **Output:**
  ```json
  {
    "revenue": [
      {
        "lot_id": 1,
        "lot_name": "Lot A",
        "total_revenue": 120
      }
    ]
  }
  ```

---

### User
#### Register User
- **POST** `/auth/register`
- **Input:**
  ```json
  {
    "email_address": "user@email.com",
    "password": "yourpassword",
    "full_name": "User Name",
    "address": "User Address",
    "postal_code": "123456"
  }
  ```

#### Book a Spot
- **POST** `/user/lots/<lot_id>/book`
- **Input:**
  ```json
  {
    "vehicle_number": "GJ01AB1234"
  }
  ```
- **Output:**
  ```json
  {
    "message": "Spot successfully reserved.",
    "spot_id": 1,
    "reservation_id": 5,
    "checkin_time_ist": "2024-06-01 10:00:00"
  }
  ```

#### Show Release Summary
- **GET** `/user/reservations/<reservation_id>/release-summary`
- **Output:**
  ```json
  {
    "reservation_id": 5,
    "spot_id": 1,
    "checkin_time_ist": "2024-06-01 10:00:00",
    "current_time_ist": "2024-06-01 12:30:00",
    "duration_hours": 3,
    "hourly_rate": 20,
    "amount_due": 60,
    "status": "active"
  }
  ```

#### Release a Spot
- **POST** `/user/reservations/<reservation_id>/release`
- **Output:**
  ```json
  {
    "message": "Reservation successfully released.",
    "duration_hours": 3,
    "hourly_rate": 20,
    "amount_due": 60,
    "checkin_time_ist": "2024-06-01 10:00:00",
    "checkout_time_ist": "2024-06-01 12:30:00"
  }
  ```

#### View Booking History
- **GET** `/user/history`
- **Output:**
  ```json
  {
    "history": [
      {
        "reservation_id": 5,
        "spot_id": 1,
        "vehicle_number": "GJ01AB1234",
        "checkin_time_ist": "2024-06-01 10:00:00",
        "checkout_time_ist": "2024-06-01 12:30:00",
        "status": "released"
      }
    ]
  }
  ```

#### User Summary (for Charts)
- **GET** `/user/summary`
- **Output:**
  ```json
  {
    "total_bookings": 5,
    "total_paid": 300,
    "lots": {
      "Lot A": { "bookings": 3, "amount_paid": 180 },
      "Lot B": { "bookings": 2, "amount_paid": 120 }
    }
  }
  ```

---

## 8. Business Logic & Features
- **Admin:** Can manage lots, spots, users, view summaries, and see real-time status and revenue.
- **User:** Can register, login, book/release spots, view history, and see their own usage summary.
- **All times are in Indian Standard Time (IST).**
- **Lot names are unique.**
- **You cannot delete a lot or spot if it is currently occupied.**

---

## 9. Time Zone Handling
- All times (check-in, check-out, summaries) are handled and returned in Indian Standard Time (IST).
- Internally, times are stored as timezone-aware datetimes.

---

## 10. Postman Collection
See the provided `Temp.postman_collection.json` for ready-to-use API requests in Postman.

---

## 11. Contact
For any questions, support, or further development, please contact us. 