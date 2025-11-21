# Complete API Documentation

This document lists all the APIs developed in this backend training project.

## Base URL
All APIs are prefixed with `/api` unless otherwise specified.

---

## 🔐 Authentication & Admin APIs

### Base Path: `/api/admin`

#### 1. Admin Login
- **Endpoint**: `POST /api/admin/login`
- **Description**: Authenticate admin user with email and password to get JWT token
- **Authentication**: Not required
- **Request Body**:
```json
{
  "email": "admin@yatra.com",
  "password": "Admin@123"
}
```
- **Response** (200):
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Controller**: `adminLogin` in `adminController.js`
- **Route File**: `src/routes/adminRoutes.js:72`

#### 2. Refresh JWT Token
- **Endpoint**: `POST /api/admin/refresh`
- **Description**: Refresh an existing JWT token to extend its expiration
- **Authentication**: Required (Bearer Token)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "2h",
  "tokenType": "Bearer",
  "refreshedAt": "2024-01-15T10:30:00.000Z"
}
```
- **Controller**: `refreshToken` in `authController.js`
- **Route File**: `src/routes/adminRoutes.js:108`

#### 3. Validate JWT Token
- **Endpoint**: `GET /api/admin/validate`
- **Description**: Check if a JWT token is still valid without refreshing it
- **Authentication**: Required (Bearer Token)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "email": "admin@yatra.com",
    "role": "admin"
  },
  "expiresIn": 7200,
  "expiresAt": "2024-01-15T12:30:00.000Z"
}
```
- **Controller**: `validateToken` in `authController.js`
- **Route File**: `src/routes/adminRoutes.js:146`

#### 4. Add Admin User
- **Endpoint**: `POST /api/admin/add-admin`
- **Description**: Add a new admin user to the system
- **Authentication**: Required (Bearer Token + Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "email": "newadmin@yatra.com",
  "password": "Admin@123"
}
```
- **Response** (201):
```json
{
  "success": true,
  "message": "Admin added successfully",
  "data": {
    "id": 1,
    "email": "newadmin@yatra.com"
  }
}
```
- **Controller**: `addAdmin` in `adminController.js`
- **Route File**: `src/routes/adminRoutes.js:148`

---

## 👥 Staff Management APIs

### Base Path: `/api/staff`

#### 5. Get All Staff
- **Endpoint**: `GET /api/staff/get-all-staff`
- **Description**: Retrieve all staff members from the system
- **Authentication**: Required (Bearer Token + Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "staffId": "STF001"
    }
  ]
}
```
- **Controller**: `getAllStaff` in `staffController.js`
- **Route File**: `src/routes/staffRoutes.js:7`

#### 6. Add Staff
- **Endpoint**: `POST /api/staff/add-staff`
- **Description**: Create a new staff member
- **Authentication**: Required (Bearer Token + Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "staffId": "STF001",
  "password": "password123"
}
```
- **Response** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
- **Controller**: `addStaff` in `staffController.js`
- **Route File**: `src/routes/staffRoutes.js:9`

#### 7. Staff Login
- **Endpoint**: `POST /api/staff/login`
- **Description**: Authenticate staff member with staffId and password
- **Authentication**: Not required
- **Request Body**:
```json
{
  "staffId": "STF001",
  "password": "password123"
}
```
- **Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Controller**: `staffLogin` in `staffController.js`
- **Route File**: `src/routes/staffRoutes.js:11`

---

## 📦 Order Management APIs

### Base Path: `/api/orders`

#### 8. Create Order
- **Endpoint**: `POST /api/orders/create-order`
- **Description**: Create a new order with products
- **Authentication**: Required (Bearer Token + Staff or Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "user_name": "John Doe",
  "user_phone": "1234567890",
  "address": "123 Main St, City",
  "staff_id": 1,
  "requested_delivery_date": "2024-12-31T00:00:00.000Z",
  "advance_received": true,
  "products": [
    {
      "product_name": "sofa",
      "product_status": "pending"
    },
    {
      "product_name": "mattress",
      "product_status": "pending"
    }
  ]
}
```
- **Response** (201):
```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "message": "Order created successfully"
  }
}
```
- **Controller**: `createOrderController` in `orderController.js`
- **Route File**: `src/routes/orderRoutes.js:7`

#### 9. Get All Orders
- **Endpoint**: `GET /api/orders/get-all-orders`
- **Description**: Retrieve all orders with pagination and search
- **Authentication**: Required (Bearer Token + Staff or Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 10): Items per page
  - `search` (optional): Search term for user name or phone
- **Response** (200):
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 50,
  "totalPages": 5,
  "data": [
    {
      "order_id": 1,
      "user_name": "John Doe",
      "user_phone": "1234567890",
      "address": "123 Main St",
      "staff_id": 1,
      "order_date": "2024-01-15T10:30:00.000Z",
      "requested_delivery_date": "2024-12-31T00:00:00.000Z",
      "advance_received": true,
      "order_status": "pending",
      "products": [
        {
          "product_id": 1,
          "product_name": "sofa",
          "product_status": "pending"
        }
      ]
    }
  ],
  "admin": true
}
```
- **Controller**: `getAllOrdersController` in `orderController.js`
- **Route File**: `src/routes/orderRoutes.js:8`
- **Note**: If user role is 'staff', returns orders filtered by staff ID

---

## ✅ Task Management APIs

### Base Path: `/api/tasks` (Note: Currently not registered in app.js)

#### 10. Assign Task
- **Endpoint**: `POST /api/tasks/assign-task`
- **Description**: Assign a task to a staff member
- **Authentication**: Required (Bearer Token + Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "task": "Complete order #123",
  "staffId": 1,
  "last_date": "2024-12-31T00:00:00.000Z"
}
```
- **Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "task": "Complete order #123",
    "staffId": 1,
    "status": "pending"
  }
}
```
- **Controller**: `assignTaskController` in `adminController.js`
- **Route File**: `src/routes/taskRouter.js:8`
- **⚠️ Issue**: Route not registered in `app.js`

#### 11. Get All Tasks
- **Endpoint**: `GET /api/tasks/get-all-tasks`
- **Description**: Retrieve all tasks with pagination, search, and filters
- **Authentication**: Required (Bearer Token + Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 10): Items per page
  - `search` (optional): Search term
  - `status` (optional, default: 'pending'): Filter by status
  - `staffId` (optional): Filter by staff ID
- **Response** (200):
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {...}
  }
}
```
- **Controller**: `getAllTasksController` in `adminController.js`
- **Route File**: `src/routes/taskRouter.js:9`
- **⚠️ Issue**: Route not registered in `app.js`

#### 12. Update Task Status
- **Endpoint**: `PUT /api/tasks/update-task-status`
- **Description**: Update the status of a task
- **Authentication**: Required (Bearer Token + Staff or Admin Role)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "taskId": 1,
  "status": "completed"
}
```
- **Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```
- **Controller**: `updateTaskStatusController` in `adminController.js`
- **Route File**: `src/routes/taskRouter.js:10`
- **⚠️ Issue**: Route not registered in `app.js`

---

## 🏥 Health Check API

### Base Path: `/` (root)

#### 13. Health Check
- **Endpoint**: `GET /health`
- **Description**: Check if the server is running and healthy
- **Authentication**: Not required
- **Response** (200):
```json
{
  "success": true,
  "message": "Server running"
}
```
- **Route File**: `src/app.js:52`

---

## 📝 Summary

### Total APIs: 13

**By Category:**
- **Admin/Auth**: 4 APIs
- **Staff Management**: 3 APIs
- **Order Management**: 2 APIs
- **Task Management**: 3 APIs (⚠️ Not registered)
- **Health Check**: 1 API

### Authentication Methods

1. **JWT Bearer Token**: Most APIs require authentication
2. **Role-Based Access Control**:
   - `requireAdmin`: Only admin users
   - `requireStaffOrAdmin`: Both staff and admin users

### Known Issues

1. **Task Router Not Registered**: The `taskRouter` is defined but not imported/registered in `app.js`. To fix:
   ```javascript
   // Add to src/app.js
   import taskRouter from './routes/taskRouter.js';
   app.use('/api/tasks', taskRouter);
   ```

2. **Missing Import**: `getAllOrdersByStaffId` is used in `orderController.js` but not imported from `OrderModel.js`

3. **SQL Syntax Error**: The `getAllOrdersByStaffId` function in `OrderModel.js` has SQL syntax issues (lines 212, 214, 217, 218)

---

## 🔗 Swagger Documentation

All APIs are documented using Swagger/OpenAPI 3.0. Access the interactive documentation at:
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Swagger JSON**: `http://localhost:5000/api-docs.json`

---

## 📁 File Structure

```
src/
├── app.js                    # Main Express app configuration
├── server.js                 # Server startup
├── routes/
│   ├── adminRoutes.js       # Admin & Auth routes (4 endpoints)
│   ├── staffRoutes.js       # Staff management routes (3 endpoints)
│   ├── orderRoutes.js        # Order management routes (2 endpoints)
│   └── taskRouter.js         # Task management routes (3 endpoints) ⚠️
├── controllers/
│   ├── adminController.js    # Admin & Task controllers
│   ├── authController.js     # Token refresh & validation
│   ├── staffController.js    # Staff management
│   └── orderController.js    # Order management
└── middleware/
    └── auth.js               # JWT authentication & authorization
```

---

*Last Updated: Based on current codebase analysis*

