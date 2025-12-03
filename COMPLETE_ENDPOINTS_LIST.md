# Complete List of All Endpoints (Including Missing Routes)

## 📊 Summary
- **Total Endpoints Found**: 14
- **Routes Defined**: 13
- **Missing Routes**: 1

---

## ✅ Currently Registered Endpoints (13)

### 1. Authentication & Admin APIs
**Route File**: `src/routes/adminRoutes.js`

| # | Method | Endpoint | Controller | Status |
|---|--------|----------|------------|--------|
| 1 | `POST` | `/api/admin/login` | `adminLogin` | ✅ Active |
| 2 | `POST` | `/api/admin/refresh` | `refreshToken` | ✅ Active |
| 3 | `GET` | `/api/admin/validate` | `validateToken` | ✅ Active |
| 4 | `POST` | `/api/admin/add-admin` | `addAdmin` | ✅ Active |

### 2. Staff Management APIs
**Route File**: `src/routes/staffRoutes.js`

| # | Method | Endpoint | Controller | Status |
|---|--------|----------|------------|--------|
| 5 | `GET` | `/api/staff/get-all-staff` | `getAllStaff` | ✅ Active |
| 6 | `POST` | `/api/staff/add-staff` | `addStaff` | ✅ Active |
| 7 | `POST` | `/api/staff/login` | `staffLogin` | ✅ Active |

### 3. Order Management APIs
**Route File**: `src/routes/orderRoutes.js`

| # | Method | Endpoint | Controller | Status |
|---|--------|----------|------------|--------|
| 8 | `POST` | `/api/orders/create-order` | `createOrderController` | ✅ Active |
| 9 | `GET` | `/api/orders/get-all-orders` | `getAllOrdersController` | ✅ Active |

### 4. Task Management APIs
**Route File**: `src/routes/taskRouter.js` ⚠️ **NOT REGISTERED IN app.js**

| # | Method | Endpoint | Controller | Status |
|---|--------|----------|------------|--------|
| 10 | `POST` | `/api/tasks/assign-task` | `assignTaskController` | ⚠️ Not Registered |
| 11 | `GET` | `/api/tasks/get-all-tasks` | `getAllTasksController` | ⚠️ Not Registered |
| 12 | `PUT` | `/api/tasks/update-task-status` | `updateTaskStatusController` | ⚠️ Not Registered |

### 5. Health Check API
**Route File**: `src/app.js`

| # | Method | Endpoint | Controller | Status |
|---|--------|----------|------------|--------|
| 13 | `GET` | `/health` | Inline handler | ✅ Active |

---

## ❌ Missing Endpoint (Controller Exists But No Route)

### Missing Route #14: Get Tasks by Staff ID

**Controller Found**: `getTaskByStaffIdController` in `src/controllers/adminController.js` (line 125)

**Controller Code**:
```javascript
export const getTaskByStaffIdController = async (req, res) => {
  try {
    const { staffId, page = 1, limit = 10, search = "" , status = 'pending'} = req.query;
    const tasks = await getTaskByStaffId(staffId, page, limit, search, status);
    console.log(tasks, "tasks");
    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error getting task by staff id:', error);
    return res.status(500).json({ success: false, message: 'Failed to get task by staff id' });
  }
}
```

**Suggested Endpoint**:
- **Method**: `GET`
- **Path**: `/api/tasks/get-tasks-by-staff/:staffId` or `/api/tasks/get-tasks-by-staff`
- **Query Parameters**: 
  - `staffId` (required if not in path)
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `search` (optional)
  - `status` (optional, default: 'pending')
- **Authentication**: Required (Bearer Token + Staff or Admin Role)
- **Description**: Get all tasks assigned to a specific staff member

**To Add This Route**:
Add to `src/routes/taskRouter.js`:
```javascript
import { getTaskByStaffIdController } from '../controllers/adminController.js';

// Add this route
taskRouter.get('/get-tasks-by-staff', authenticateToken, requireStaffOrAdmin, getTaskByStaffIdController);
// OR with path parameter:
taskRouter.get('/get-tasks-by-staff/:staffId', authenticateToken, requireStaffOrAdmin, getTaskByStaffIdController);
```

---

## 🔧 Additional Findings

### 1. Task Router Not Registered
The `taskRouter` exists but is **NOT imported/registered** in `src/app.js`. 

**To Fix**: Add to `src/app.js`:
```javascript
import taskRouter from './routes/taskRouter.js';
app.use('/api/tasks', taskRouter);
```

### 2. Missing Import in orderController.js
`getAllOrdersByStaffId` is used but not imported from `OrderModel.js`:
```javascript
// Line 31 in orderController.js uses:
const orders = await getAllOrdersByStaffId({ staffId: user.id });
// But it's not imported at the top of the file
```

**To Fix**: Add to imports in `src/controllers/orderController.js`:
```javascript
import { createOrder, createOrderProductsTable, createOrderTable, getAllOrders, getAllOrdersByStaffId } from '../models/OrderModel.js';
```

### 3. SQL Syntax Error in OrderModel.js
The `getAllOrdersByStaffId` function has SQL syntax issues (lines 212, 214, 217, 218).

---

## 📝 Complete Endpoint Summary

### By Status:
- ✅ **Active & Registered**: 10 endpoints
- ⚠️ **Defined but Not Registered**: 3 endpoints (task routes)
- ❌ **Controller Exists, No Route**: 1 endpoint (getTaskByStaffIdController)

### By Category:
- **Admin/Auth**: 4 endpoints
- **Staff Management**: 3 endpoints  
- **Order Management**: 2 endpoints
- **Task Management**: 4 endpoints (3 not registered, 1 missing route)
- **Health Check**: 1 endpoint

---

## 🚀 Action Items

1. **Add missing route** for `getTaskByStaffIdController`
2. **Register taskRouter** in `app.js` to enable task endpoints
3. **Fix missing import** in `orderController.js`
4. **Fix SQL syntax** in `OrderModel.js`
5. **Update API documentation** to include the missing endpoint

---

*Last Updated: Based on complete codebase analysis*

