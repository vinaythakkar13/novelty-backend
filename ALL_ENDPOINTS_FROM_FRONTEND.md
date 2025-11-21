# Complete List of All Endpoints (From Frontend API Definitions)

Based on the frontend code in `/home/vinay/Documents/staff-management`, here are ALL the endpoints that need to be implemented in the backend:

## 📋 STAFF ENDPOINTS (`/staff/*`)

### Authentication
1. **POST** `/staff/login` - Staff login

### Tasks
2. **GET** `/staff/get-tasks` - Get tasks assigned to authenticated staff
3. **GET** `/staff/get-all-completed-tasks` - Get completed tasks (with optional search parameter)

### Orders
4. **GET** `/staff/get-orders` - Get orders created by authenticated staff
5. **GET** `/staff/get-completed-orders` - Get completed orders (with filters: startDate, endDate, search, rating)
6. **POST** `/staff/create-order` - Create new order
7. **PUT** `/staff/update-order-aedvance-payment` - Update advance payment status
8. **PUT** `/staff/update-order-full-payment` - Update full payment status
9. **PUT** `/staff/update-order-review-link-sent` - Update review link sent status
10. **PUT** `/staff/update-order-product-status` - Update per-product statuses
11. **PUT** `/staff/update-order-status` - Update overall order status

### Dashboard
12. **GET** `/staff/staff-dashboard` - Get staff dashboard summary (tasks, orders, metrics)

### Task Management
13. **POST** `/staff/update-task-status` - Update task status (todo/in_progress/blocked/completed)

### Staff Management (Admin uses these)
14. **GET** `/staff/get-all-staff` - Get all staff (with filters: search, status, sort)
15. **POST** `/staff/add-staff` - Create new staff member
16. **PUT** `/staff/update-staff/:id` - Update staff status (active/inactive)

---

## 📋 ADMIN ENDPOINTS (`/admin/*`)

### Authentication
17. **POST** `/admin/login` - Admin login

### Admin Management
18. **GET** `/admin/get-all-admin` - Get all admins
19. **POST** `/admin/add-admin` - Create new admin
20. **DELETE** `/admin/remove-admin` - Remove admin

### Tasks
21. **GET** `/admin/get-all-tasks-for-staff` - Get all tasks (with pagination & filters: page, limit, search, status, id)
22. **GET** `/admin/get-all-completed-tasks-for-staff` - Get completed tasks (with pagination & filters: page, limit, search, id)
23. **POST** `/admin/create-task-for-staff` - Create task for staff
24. **PUT** `/admin/update-task-status` - Update task status
25. **DELETE** `/admin/delete-task-for-staff` - Delete task

### Orders
26. **GET** `/admin/get-all-orders` - Get all orders (with pagination & filters: page, limit, search, status, type, sort)
27. **GET** `/admin/get-completed-orders` - Get completed orders (with filters: startDate, endDate, search, rating)

---

## 📊 Summary

### Total Endpoints: 27

**Staff Endpoints**: 16
- Authentication: 1
- Tasks: 2
- Orders: 7
- Dashboard: 1
- Task Management: 1
- Staff Management: 4

**Admin Endpoints**: 11
- Authentication: 1
- Admin Management: 3
- Tasks: 5
- Orders: 2

---

## 🔍 Current Status in backend_training

**Found in current codebase**: 13 endpoints (basic implementation)
**Missing from current codebase**: 14 endpoints

### Missing Endpoints:
1. GET `/staff/get-tasks`
2. GET `/staff/get-all-completed-tasks`
3. GET `/staff/get-orders`
4. GET `/staff/get-completed-orders`
5. PUT `/staff/update-order-aedvance-payment`
6. PUT `/staff/update-order-full-payment`
7. PUT `/staff/update-order-review-link-sent`
8. PUT `/staff/update-order-product-status`
9. PUT `/staff/update-order-status`
10. GET `/staff/staff-dashboard`
11. GET `/admin/get-all-admin`
12. DELETE `/admin/remove-admin`
13. GET `/admin/get-all-completed-tasks-for-staff`
14. DELETE `/admin/delete-task-for-staff`

---

## 📝 Next Steps

1. **Extract RAR archive** to check if full backend code exists
2. **Search other repositories** for the complete implementation
3. **Recreate missing endpoints** based on frontend API definitions

---

*Generated from frontend API definitions in staff-management project*

