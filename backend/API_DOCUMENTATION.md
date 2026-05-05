# HireBuddy API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication
All endpoints (except `/auth/*` and public endpoints) require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Sign Up
**POST** `/auth/signup`
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "password": "securepassword",
  "role": "USER" // or "HELPER"
}
```
Response: `{ success: true, token, user }`

### Login
**POST** `/auth/login`
```json
{
  "phone": "9876543210",
  "password": "securepassword"
}
```
Response: `{ success: true, token, user }`

### Request OTP
**POST** `/auth/request-otp`
```json
{
  "phone": "9876543210"
}
```

---

## 📋 Task Management

### Create Task
**POST** `/tasks`
```json
{
  "title": "Buy groceries",
  "description": "Need to buy groceries from nearby store",
  "category": "Grocery",
  "location": "123 Main Street",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "budget": 50000, // in paise (₹500)
  "preferredAt": "2026-03-31T10:00:00Z"
}
```

### Get Nearby Tasks (for helpers)
**GET** `/tasks/nearby?radiusKm=5&limit=20&offset=0`
Response: Array of tasks within specified radius

### Search Tasks
**GET** `/tasks/search?category=Cleaning&city=Delhi&radiusKm=5&status=OPEN`
Response: Filtered list of tasks

### Get My Created Tasks
**GET** `/tasks/created`

### Get My Assigned Tasks (helpers only)
**GET** `/tasks/assigned`

### Get Task Details
**GET** `/tasks/{taskId}`

### Accept Task (helper)
**POST** `/tasks/{taskId}/accept`

### Update Task Status
**PUT** `/tasks/{taskId}/status`
```json
{
  "status": "IN_PROGRESS" // OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
}
```

### Cancel Task
**PUT** `/tasks/{taskId}/cancel`
```json
{
  "reason": "Task cancelled by user"
}
```

### Get Task Statistics
**GET** `/tasks/stats`
Response: `{ tasksCreated, tasksAssigned, tasksCompleted, completionRate }`

---

## 💳 Payment (Razorpay)

### Create Payment Order
**POST** `/payments/create-order`
```json
{
  "taskId": "task-uuid",
  "amount": 50000 // in paise
}
```
Response: `{ orderId, paymentId, amount, currency }`

### Verify Payment
**POST** `/payments/verify`
```json
{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_xyz",
  "razorpay_signature": "signature_xyz",
  "task_id": "task-uuid"
}
```

### Get Payment History
**GET** `/payments/history?limit=20&offset=0`

### Get Payment Details
**GET** `/payments/{paymentId}`

### Refund Payment
**POST** `/payments/{paymentId}/refund`
```json
{
  "reason": "Task cancelled"
}
```

---

## 💬 Messaging

### Send Message
**POST** `/messages`
```json
{
  "taskId": "task-uuid",
  "receiverId": "user-uuid",
  "message": "Message text",
  "messageType": "TEXT", // TEXT, IMAGE, OFFER
  "mediaUrl": "https://..." // optional
}
```

### Get Task Messages
**GET** `/messages/task/{taskId}?limit=50&offset=0`

### Get Conversations
**GET** `/messages/conversations?limit=20&offset=0`

### Mark Messages as Read
**PUT** `/messages/task/{taskId}/read`

### Get Unread Message Count
**GET** `/messages/unread-count`

### Delete Message
**DELETE** `/messages/{messageId}`

---

## ⭐ Reviews & Ratings

### Create Review
**POST** `/reviews`
```json
{
  "taskId": "task-uuid",
  "givenToId": "helper-uuid",
  "rating": 5, // 1-5
  "comment": "Great work!"
}
```

### Get Reviews for User
**GET** `/reviews/user/{userId}?limit=20&offset=0`
Response: `{ reviews, stats: { totalReviews, averageRating, ratingDistribution } }`

### Get My Reviews Given
**GET** `/reviews/my-reviews?limit=20&offset=0`

### Get Top-Rated Helpers
**GET** `/reviews/top-helpers?limit=10`

### Update Review
**PUT** `/reviews/{reviewId}`
```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

### Delete Review
**DELETE** `/reviews/{reviewId}`

---

## 🔔 Notifications

### Get Notifications
**GET** `/notifications?limit=20&offset=0&isRead=false`

### Get Unread Notification Count
**GET** `/notifications/unread-count`

### Mark Notification as Read
**PUT** `/notifications/{notificationId}/read`

### Mark All Notifications as Read
**PUT** `/notifications/mark/read-all`

### Delete Notification
**DELETE** `/notifications/{notificationId}`

---

## 👤 User Management

### Get Profile
**GET** `/user/profile`

### Update Profile
**PUT** `/user/profile`
```json
{
  "name": "Updated Name",
  "image": "https://...",
  "latitude": 28.7041,
  "longitude": 77.1025,
  "city": "Delhi"
}
```

### Update Helper Profile
**PUT** `/user/helper-profile` (helpers only)
```json
{
  "skills": "Plumbing, Electrician",
  "experience": 5,
  "hourlyRate": 50000, // in paise
  "isAvailable": true
}
```

---

## 🔌 WebSocket Events (Real-time)

### Connection
```javascript
io.emit('connection', socket => {
  socket.auth = { token: 'jwt_token' }
})
```

### Messages
```javascript
// Send message
socket.emit('send_message', {
  taskId: 'uuid',
  receiverId: 'uuid',
  message: 'text',
  messageType: 'TEXT'
})

// Receive message
socket.on('new_message', (data) => {
  console.log(data.message)
})

// Typing indicator
socket.emit('user_typing', { taskId: 'uuid' })
socket.on('user_typing', (data) => {
  console.log(data.userId, 'is typing')
})
```

### Notifications
```javascript
// Send notification
socket.emit('send_notification', {
  taskId: 'uuid',
  receiverId: 'uuid',
  type: 'task_accepted',
  title: 'Task Accepted!',
  message: 'A helper has accepted your task'
})

// Receive notification
socket.on('receive_notification', (notification) => {
  console.log(notification)
})
```

### Task Updates
```javascript
// Join task room
socket.emit('join_task', { taskId: 'uuid' })

// Task status changed
socket.on('task_status_changed', (data) => {
  console.log(data.taskId, 'status:', data.newStatus)
})

// Payment completed
socket.on('payment_notification', (data) => {
  console.log('Payment of ₹', data.amount/100, 'received!')
})
```

---

## 🚀 Complete Task Flow Example

### 1. User (Poster) Creates Task
```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "category": "Grocery",
    "location": "123 Main St",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "budget": 50000
  }'
```

### 2. Helper Discovers Task
```bash
curl -X GET "http://localhost:8080/api/tasks/nearby?radiusKm=5" \
  -H "Authorization: Bearer <helper_token>"
```

### 3. Helper Accepts Task
```bash
curl -X POST http://localhost:8080/api/tasks/{taskId}/accept \
  -H "Authorization: Bearer <helper_token>"
```

### 4. Users Communicate via Messages
```bash
curl -X POST http://localhost:8080/api/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "{taskId}",
    "receiverId": "{otherUserId}",
    "message": "I am on my way!"
  }'
```

### 5. Helper Marks Task as In Progress
```bash
curl -X PUT http://localhost:8080/api/tasks/{taskId}/status \
  -H "Authorization: Bearer <helper_token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "IN_PROGRESS" }'
```

### 6. Helper Completes Task
```bash
curl -X PUT http://localhost:8080/api/tasks/{taskId}/status \
  -H "Authorization: Bearer <helper_token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "COMPLETED" }'
```

### 7. Create Payment Order (Razorpay)
```bash
curl -X POST http://localhost:8080/api/payments/create-order \
  -H "Authorization: Bearer <poster_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "{taskId}",
    "amount": 50000
  }'
```

### 8. Verify Payment
```bash
curl -X POST http://localhost:8080/api/payments/verify \
  -H "Authorization: Bearer <poster_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "{orderId}",
    "razorpay_payment_id": "{paymentId}",
    "razorpay_signature": "{signature}",
    "task_id": "{taskId}"
  }'
```

### 9. Post Review
```bash
curl -X POST http://localhost:8080/api/reviews \
  -H "Authorization: Bearer <poster_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "{taskId}",
    "givenToId": "{helperId}",
    "rating": 5,
    "comment": "Excellent work!"
  }'
```

---

## Error Handling

All errors follow this format:
```json
{
  "message": "Error description",
  "error": "error_code"
}
```

Common HTTP Status Codes:
- `200`: OK
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

---

## Rate Limiting
Currently no rate limiting implemented. Consider adding for production.

## Pagination
- `limit`: Default 20, max 100
- `offset`: Default 0

## Sorting
Most list endpoints support sorting via query parameters.

---

**Generated**: March 30, 2026
**Version**: 1.0.0
