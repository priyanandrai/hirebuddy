# HireBuddy MVP Backend Execution Plan

Date: 2026-03-18

## 1) Goal and Scope

Build an MVP-safe backend contract that supports the existing webapp screens and unlocks end-to-end flow:

1. Customer posts task.
2. Tasker browses open tasks.
3. Tasker accepts task.
4. Both sides exchange task chat.
5. Tasker marks done and customer confirms completion.
6. Payment is released and both can leave ratings.

This plan is aligned to current frontend payloads used in create-task and my-tasks pages.

## 2) Current Frontend Contract (Already in Webapp)

Observed payload for task creation:

- title: string
- category: string
- description: string
- location: string
- budget: number
- preferredAt: ISO date string (from date input)
- helperId: optional string

Observed task list needs:

- id
- title
- category
- status
- date (display-friendly)
- budget

## 3) API Design (Exact Endpoints)

Base URL:

- /api

Auth header for protected routes:

- Authorization: Bearer <jwt>

### 3.1 Auth

- POST /auth/signup
- POST /auth/login
- POST /auth/send-otp
- POST /auth/verify-otp
- POST /auth/google
- GET /auth/me

### 3.2 User/Helper Discovery

- GET /users/helpers?city=Meerut&category=Delivery&page=1&limit=20
- GET /users/helpers/:helperId

### 3.3 Tasks (Poster)

- POST /tasks
- GET /tasks/my?status=OPEN,ASSIGNED,IN_PROGRESS,COMPLETED,CANCELLED&page=1&limit=20
- GET /tasks/:taskId
- PATCH /tasks/:taskId (only when OPEN)
- POST /tasks/:taskId/cancel

### 3.4 Tasks (Tasker)

- GET /tasks/open?category=Delivery&near=lat,lng&radiusKm=10&page=1&limit=20
- POST /tasks/:taskId/accept
- GET /tasks/accepted/me?page=1&limit=20
- POST /tasks/:taskId/mark-in-progress
- POST /tasks/:taskId/mark-complete

### 3.5 Completion and Payment

- POST /tasks/:taskId/confirm-completion (poster only)
- POST /payments/:taskId/hold (called internally by task-create flow)
- POST /payments/:taskId/release (on completion confirmation)
- POST /payments/:taskId/refund (on eligible cancel/dispute)
- GET /payments/:taskId

### 3.6 Chat

- POST /chats/tasks/:taskId/messages
- GET /chats/tasks/:taskId/messages?cursor=<msgId>&limit=30
- GET /chats/tasks/:taskId/thread

WebSocket channels:

- ws/tasks/:taskId/chat
- ws/users/:userId/notifications

### 3.7 Ratings

- POST /tasks/:taskId/reviews
- GET /users/:userId/reviews?page=1&limit=20

## 4) Request and Response Contracts

## 4.1 POST /tasks

Request:

{
  "title": "Buy groceries",
  "category": "Shopping",
  "description": "Need vegetables and milk",
  "location": "Modipuram, Meerut",
  "budget": 500,
  "preferredAt": "2026-03-20",
  "helperId": "optional-helper-uuid"
}

Response 201:

{
  "success": true,
  "data": {
    "id": "task_uuid",
    "title": "Buy groceries",
    "category": "Shopping",
    "description": "Need vegetables and milk",
    "location": "Modipuram, Meerut",
    "budget": 500,
    "status": "OPEN",
    "preferredAt": "2026-03-20T00:00:00.000Z",
    "posterId": "user_uuid",
    "helperId": "optional-helper-uuid",
    "createdAt": "2026-03-18T10:00:00.000Z"
  }
}

## 4.2 GET /tasks/my

Response 200:

{
  "success": true,
  "data": [
    {
      "id": "task_uuid",
      "title": "Buy groceries",
      "category": "Shopping",
      "status": "OPEN",
      "date": "20 Mar 2026",
      "budget": 500
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}

## 4.3 POST /tasks/:taskId/accept

Response 200:

{
  "success": true,
  "data": {
    "taskId": "task_uuid",
    "status": "ASSIGNED",
    "acceptedBy": "helper_uuid",
    "acceptedAt": "2026-03-18T10:15:00.000Z"
  }
}

## 4.4 POST /tasks/:taskId/mark-complete

Response 200:

{
  "success": true,
  "data": {
    "taskId": "task_uuid",
    "status": "AWAITING_CONFIRMATION",
    "completedByHelperAt": "2026-03-18T13:40:00.000Z"
  }
}

## 4.5 POST /tasks/:taskId/confirm-completion

Response 200:

{
  "success": true,
  "data": {
    "taskId": "task_uuid",
    "status": "COMPLETED",
    "confirmedAt": "2026-03-18T14:00:00.000Z",
    "paymentStatus": "RELEASED"
  }
}

## 5) Task State Machine (Single Source of Truth)

States:

- OPEN
- ASSIGNED
- IN_PROGRESS
- AWAITING_CONFIRMATION
- COMPLETED
- CANCELLED
- DISPUTED

Transitions:

- OPEN -> ASSIGNED (helper accepts)
- ASSIGNED -> IN_PROGRESS (helper starts)
- IN_PROGRESS -> AWAITING_CONFIRMATION (helper marks complete)
- AWAITING_CONFIRMATION -> COMPLETED (poster confirms)
- OPEN -> CANCELLED (poster cancel)
- ASSIGNED -> CANCELLED (with policy checks)
- AWAITING_CONFIRMATION -> DISPUTED (poster disputes)

## 6) Prisma Data Model (MySQL)

Use UUID strings for public IDs; keep numeric auto-increment optional if desired for internal indexing.

```prisma
enum UserRole {
  CUSTOMER
  TASKER
  ADMIN
}

enum TaskStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  AWAITING_CONFIRMATION
  COMPLETED
  CANCELLED
  DISPUTED
}

enum PaymentStatus {
  NOT_REQUIRED
  HOLD_CREATED
  RELEASED
  REFUNDED
  FAILED
}

enum ReviewRole {
  CUSTOMER_TO_TASKER
  TASKER_TO_CUSTOMER
}

model User {
  id             String      @id @default(uuid())
  name           String
  email          String      @unique
  phone          String?     @unique
  passwordHash   String?
  role           UserRole
  city           String?
  ratingAvg      Decimal?    @db.Decimal(3,2)
  ratingCount    Int         @default(0)
  isVerified     Boolean     @default(false)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  postedTasks    Task[]      @relation("TaskPoster")
  assignedTasks  Task[]      @relation("TaskHelper")
  messages       Message[]
  reviewsGiven   Review[]    @relation("ReviewAuthor")
  reviewsRecv    Review[]    @relation("ReviewTarget")
}

model Task {
  id                      String        @id @default(uuid())
  title                   String
  category                String
  description             String
  location                String
  lat                     Decimal?      @db.Decimal(10,7)
  lng                     Decimal?      @db.Decimal(10,7)
  budget                  Decimal       @db.Decimal(10,2)
  preferredAt             DateTime?
  status                  TaskStatus    @default(OPEN)

  posterId                String
  helperId                String?

  acceptedAt              DateTime?
  startedAt               DateTime?
  completedByHelperAt     DateTime?
  completedConfirmedAt    DateTime?
  cancelledAt             DateTime?
  disputedAt              DateTime?

  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  poster                  User          @relation("TaskPoster", fields: [posterId], references: [id])
  helper                  User?         @relation("TaskHelper", fields: [helperId], references: [id])
  attachments             TaskAttachment[]
  messages                Message[]
  payment                 Payment?
  reviews                 Review[]

  @@index([posterId, createdAt])
  @@index([helperId, createdAt])
  @@index([status, createdAt])
}

model TaskAttachment {
  id          String      @id @default(uuid())
  taskId      String
  url         String
  mimeType    String
  createdAt   DateTime    @default(now())

  task        Task        @relation(fields: [taskId], references: [id])

  @@index([taskId])
}

model Message {
  id          String      @id @default(uuid())
  taskId      String
  senderId    String
  content     String
  createdAt   DateTime    @default(now())

  task        Task        @relation(fields: [taskId], references: [id])
  sender      User        @relation(fields: [senderId], references: [id])

  @@index([taskId, createdAt])
}

model Payment {
  id              String        @id @default(uuid())
  taskId          String        @unique
  amount          Decimal       @db.Decimal(10,2)
  currency        String        @default("INR")
  status          PaymentStatus @default(HOLD_CREATED)
  provider        String?
  providerRef     String?
  holdCreatedAt   DateTime?
  releasedAt      DateTime?
  refundedAt      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  task            Task          @relation(fields: [taskId], references: [id])
}

model Review {
  id            String      @id @default(uuid())
  taskId         String
  authorId       String
  targetUserId   String
  role           ReviewRole
  rating         Int
  comment        String?
  createdAt      DateTime    @default(now())

  task           Task        @relation(fields: [taskId], references: [id])
  author         User        @relation("ReviewAuthor", fields: [authorId], references: [id])
  targetUser     User        @relation("ReviewTarget", fields: [targetUserId], references: [id])

  @@unique([taskId, authorId])
  @@index([targetUserId, createdAt])
}
```

## 7) Backend Folder Structure (Node + Express)

- src/modules/auth
- src/modules/users
- src/modules/tasks
- src/modules/acceptance
- src/modules/chat
- src/modules/payments
- src/modules/reviews
- src/common/middleware (auth, validation, errors)
- src/common/lib (prisma, websocket, logger)

## 8) Validation Rules

Task creation:

- title: 5-120 chars
- category: non-empty, controlled list for MVP
- description: 10-1000 chars
- location: 3-200 chars
- budget: min 50, max 50000
- preferredAt: >= today

Acceptance:

- only TASKER role can accept
- cannot accept own task
- only OPEN tasks can be accepted
- enforce one active helper per task

Completion:

- only assigned helper can mark complete
- only poster can confirm completion

Reviews:

- only after task COMPLETED
- one review per user per task
- rating range 1..5

## 9) Security and Reliability Baseline

- JWT middleware on all protected routes
- Rate limit auth and chat send endpoints
- Idempotency key for accept endpoint
- DB transaction for: accept task + write event + notify
- DB transaction for: confirm completion + release payment + write event
- Audit/event log table for critical transitions

## 10) Frontend Mapping (Immediate)

Map existing webapp service layer to these backend routes:

- CREATE_TASK constant -> POST /tasks
- MY_TASK constant -> GET /tasks/my
- helper task feed page -> GET /tasks/open and POST /tasks/:taskId/accept
- task detail pages -> GET /tasks/:taskId

Normalize status text in UI:

- OPEN -> Open
- ASSIGNED or IN_PROGRESS -> In Progress
- COMPLETED -> Completed
- CANCELLED -> Cancelled

## 11) Rollout Milestones

### Milestone 1 (Week 1): Core Task Lifecycle

- Prisma schema + migrations for User, Task
- POST /tasks, GET /tasks/my, GET /tasks/:id
- GET /tasks/open, POST /tasks/:id/accept
- Basic status transitions OPEN -> ASSIGNED -> IN_PROGRESS
- Integration tests for auth and task acceptance race condition

Exit criteria:

- Customer can create task and see it in my tasks
- Tasker can browse and accept open task

### Milestone 2 (Week 2): Completion + Payment Hold/Release

- Payment table + provider adapter abstraction
- mark-complete, confirm-completion endpoints
- release/refund logic with transaction safety
- Notifications for accept and completion

Exit criteria:

- Completed tasks release payment correctly
- Cancel and refund logic works for defined scenarios

### Milestone 3 (Week 3): Chat (Task-Scoped)

- Message table + REST history endpoint
- WebSocket room by taskId
- Permission gate: only poster and assigned helper can join

Exit criteria:

- Real-time chat available after acceptance
- Message history visible in task detail

### Milestone 4 (Week 4): Ratings and Basic Trust/Safety

- Review endpoints and aggregates on user profile
- Dispute transition and support metadata
- Basic reporting endpoint and admin visibility

Exit criteria:

- Both parties can rate after completion
- Dispute path exists for non-happy flow

## 12) Testing Matrix (Minimum)

- Unit: task transition guard functions
- Integration: task create/accept/complete/confirm
- Integration: unauthorized user cannot mutate foreign task
- Integration: two taskers accept same task concurrently (one succeeds)
- E2E: create -> accept -> chat -> complete -> confirm -> review

## 13) Immediate Next 3 Engineering Tasks

1. Implement Prisma enums and Task model exactly as above, run initial migration.
2. Implement POST /tasks and GET /tasks/my to match current webapp payload and response keys.
3. Implement GET /tasks/open and POST /tasks/:taskId/accept, then replace mock tasker task list data.
