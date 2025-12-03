# Express.js MySQL Boilerplate

## Features ✨
- **Express.js** - Fast, unopinionated web framework
- **MySQL** - Reliable relational database
- **Swagger/OpenAPI** - Automatic API documentation
- **Security** - Helmet.js for security headers
- **CORS** - Cross-Origin Resource Sharing enabled
- **ES Modules** - Modern JavaScript syntax

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
A `.env` file has been created with default values. **Update these values before running:**

```bash
# Database Configuration
DB_HOST=localhost          # Your MySQL host
DB_PORT=3306              # Your MySQL port
DB_USER=root              # Your MySQL username
DB_PASSWORD=your_password # ⚠️ Change this to your MySQL password
DB_NAME=your_database     # ⚠️ Change this to your database name

# Admin Credentials
ADMIN_EMAIL=admin@example.com  # ⚠️ Change this
ADMIN_PASSWORD=admin123        # ⚠️ Change this to a secure password
```

### 3. Create Database and Tables
```sql
CREATE DATABASE your_database_name;
USE your_database_name;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

The application includes **automatic Swagger documentation** for all APIs:

### Local Access
- **Swagger UI**: http://localhost:5000/api-docs
- **JSON Spec**: http://localhost:5000/api-docs.json

### Network Access (from other devices)
- **Swagger UI**: http://192.168.20.174:5000/api-docs
- **JSON Spec**: http://192.168.20.174:5000/api-docs.json

All APIs are automatically documented using JSDoc comments. For detailed information on how to document new endpoints, see [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md).

## Available Endpoints

### Health
- `GET /health` - Check server status

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

### Admin
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/add-admin` - Add a new admin user

## Database Schema
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
