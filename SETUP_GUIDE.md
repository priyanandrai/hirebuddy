# HireBuddy - Setup & Deployment Guide

## Prerequisites
- Node.js v18+ 
- MySQL 8.0+
- npm or yarn
- Razorpay account (for payments)

---

## 🚀 Local Development Setup

### 1. Database Setup
```bash
# Create MySQL database
mysql -u root -p
> CREATE DATABASE hirebuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> EXIT;
```

### 2. Environment Configuration
```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

Fill in these critical variables:
```env
DATABASE_URL=mysql://root:password@localhost:3306/hirebuddy
JWT_SECRET=your-super-secret-jwt-key-here
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxx
FRONTEND_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Prisma
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database (optional)
npx prisma db seed
```

### 5. Start Backend Server
```bash
npm run dev
```
Server runs on `http://localhost:8080`

### 6. Test API
```bash
curl http://localhost:8080/api/health
# Response: { "status": "ok" }
```

---

## 🔧 Razorpay Integration

### 1. Get API Keys
- Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
- Navigate to Settings → API Keys
- Copy Key ID and Key Secret
- Add to `.env`

### 2. Test Payment Flow
```bash
# Create order
curl -X POST http://localhost:8080/api/payments/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-uuid",
    "amount": 50000
  }'
```

### 3. Webhook Setup (Production)
Configure webhook in Razorpay Dashboard:
- Endpoint: `https://your-domain.com/api/payments/webhook`
- Events: `payment.authorized`, `payment.failed`, `payment.captured`

---

## 🔌 WebSocket Setup

### Test Real-time Features
```javascript
// Connect to WebSocket
const io = require('socket.io-client');
const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for messages
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
});

// Send message
socket.emit('send_message', {
  taskId: 'task-uuid',
  receiverId: 'user-uuid',
  message: 'Hello!'
});
```

---

## 📦 Database Schema

### Key Tables
1. **User** - User accounts with location & wallet
2. **Task** - Tasks with location-based data
3. **Message** - Real-time chat messages
4. **Payment** - Razorpay payment tracking
5. **Review** - User ratings and reviews
6. **Notification** - Event notifications

### Run Migrations
```bash
npx prisma migrate dev
```

### View Database
```bash
npx prisma studio
```

---

## 🧪 Testing Endpoints

### 1. Register & Login
```bash
# Sign up
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Helper",
    "phone": "9876543210",
    "password": "test123",
    "role": "HELPER"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "test123"
  }'
```

### 2. Create & Find Tasks
```bash
# Create task
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "category": "Grocery",
    "location": "Main Street",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "budget": 50000
  }'

# Find nearby tasks (as helper)
curl -X GET "http://localhost:8080/api/tasks/nearby?radiusKm=5" \
  -H "Authorization: Bearer <helper-token>"
```

### 3. Accept Task & Message
```bash
# Accept task
curl -X POST http://localhost:8080/api/tasks/{taskId}/accept \
  -H "Authorization: Bearer <helper-token>"

# Send message
curl -X POST http://localhost:8080/api/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "{taskId}",
    "receiverId": "{userId}",
    "message": "I will complete this quickly!"
  }'
```

### 4. Process Payment
```bash
# Create order
curl -X POST http://localhost:8080/api/payments/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "{id}", "amount": 50000}'

# Verify payment (after Razorpay completes)
curl -X POST http://localhost:8080/api/payments/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xyz",
    "razorpay_payment_id": "pay_xyz",
    "razorpay_signature": "sig_xyz",
    "task_id": "{taskId}"
  }'
```

### 5. Reviews & Ratings
```bash
# Create review
curl -X POST http://localhost:8080/api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "{taskId}",
    "givenToId": "{helperId}",
    "rating": 5,
    "comment": "Excellent!"
  }'

# Get helper's reviews
curl -X GET "http://localhost:8080/api/reviews/user/{helperId}" \
  -H "Authorization: Bearer <token>"
```

---

## 📈 Performance Optimization

### 1. Database Indexing
Indexes are already created on:
- taskId, senderId, receiverId (Messages)
- taskId, payerId, payeeId (Payments)
- receiverId (Notifications)

### 2. Caching Strategy
```javascript
// Consider Redis for:
- User profiles
- Task listings
- Review statistics
- Notification counts
```

### 3. Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:8080/api/health
```

---

## 🐛 Debugging

### Enable Debug Logging
```bash
DEBUG=* npm run dev
```

### Check Logs
```bash
# View recent errors
tail -n 50 /var/log/hirebuddy/error.log

# Monitor real-time
tail -f /var/log/hirebuddy/app.log
```

### Database Issues
```bash
# Check connection
npx prisma db execute --stdin <<< "SELECT 1"

# Reset database (development only!)
npx prisma migrate reset
```

---

## 🚢 Production Deployment

### 1. Environment Setup
```bash
# Production .env
NODE_ENV=production
DATABASE_URL=mysql://prod_user:strong_pass@prod-db-host:3306/hirebuddy
JWT_SECRET=generate-strong-random-string
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
FRONTEND_URL=https://yourdomain.com
```

### 2. Build for Production
```bash
npm run build
NODE_ENV=production npm start
```

### 3. Using PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name "hirebuddy-api"

# Enable auto-restart on reboot
pm2 startup
pm2 save
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:8080/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

### 5. SSL/TLS Certificate
```bash
# Using Certbot with Let's Encrypt
sudo certbot certonly --nginx -d api.yourdomain.com
```

### 6. Database Backup
```bash
# Daily backup
0 2 * * * mysqldump -u user -p password hirebuddy > /backups/hirebuddy-$(date +\%Y\%m\%d).sql

# Verify backup
mysql -u user -p password hirebuddy < /backups/hirebuddy-20260330.sql
```

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Use HTTPS only (SSL/TLS)
- [ ] Enable CORS only for your domain
- [ ] Implement rate limiting
- [ ] Add input validation & sanitization
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Set up monitoring & alerts
- [ ] Implement audit logging
- [ ] Regular security updates

---

## 📊 Monitoring

### Key Metrics to Track
- API response times
- Message delivery latency
- Payment success rate
- WebSocket connection stability
- Database query performance
- Server CPU/Memory usage

### Tools
- PM2 Plus for monitoring
- Sentry for error tracking
- DataDog for infrastructure monitoring
- Grafana for visualization

---

## 📱 Frontend Integration

### Required Libraries
```json
{
  "socket.io-client": "^4.7.0",
  "axios": "^1.6.0",
  "react-query": "^3.39.3"
}
```

### Example: Connect to Backend
```javascript
import io from 'socket.io-client';
import axios from 'axios';

// Setup axios with token
axios.defaults.baseURL = 'http://localhost:8080/api';
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Setup WebSocket
const socket = io('http://localhost:8080', {
  auth: { token }
});
```

---

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Check MySQL is running: `sudo systemctl status mysql`
- Verify DATABASE_URL in .env
- Check credentials

**2. CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
- Update CORS in app.js with correct frontend URL
- Ensure credentials: true in fetch/axios

**3. JWT Token Expired**
```
Error: Token expired
```
- Refresh token implementation needed
- Add token refresh endpoint

**4. WebSocket Connection Failed**
```
WebSocket connection failed
```
- Check firewall allows port 8080
- Verify Socket.IO middleware auth

---

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Razorpay keys added
- [ ] SSL certificate installed
- [ ] Nginx/reverse proxy configured
- [ ] Process manager (PM2) setup
- [ ] Backup system configured
- [ ] Monitoring enabled
- [ ] Error tracking (Sentry) setup
- [ ] Load balancer configured (if needed)
- [ ] Domain DNS pointing to server
- [ ] Health check passing

---

## 🎓 Next Steps

1. **Run Database Migrations**: `npx prisma migrate dev`
2. **Start Development Server**: `npm run dev`
3. **Test API Endpoints**: See testing section above
4. **Setup Frontend**: Integrate with React/Next.js
5. **Configure Razorpay**: Add live keys before production
6. **Deploy**: Follow production deployment guide

---

**Last Updated**: March 30, 2026
**Version**: 1.0.0
