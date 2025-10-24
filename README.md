# BetMate

**A real-time social betting platform for friendly competition using virtual credits.**

BetMate is a production-ready full-stack mobile application where users create betting groups, place predictions on anything, and compete with friends using virtual currency. No real money involved—just friendly competition with real-time chat, leaderboards, and statistics tracking.

---

## What Is This?

**Core Concept:** Create groups with friends → Make predictions on any topic → Place virtual credit bets → Compete and track performance.

**Example:** Your "March Madness" group creates a bet: "Who wins the championship?" with 4 team options. Everyone places credits on their pick. When resolved (by creator, designated judge, or democratic vote), winners split the pool proportionally.

**Key Use Cases:**
- Sports predictions (Fantasy Football, March Madness, Super Bowl)
- TV show outcomes (who gets eliminated, season winners)
- Personal challenges ("I can do 100 pushups")
- Office predictions (quarterly results, project deadlines)
- Any verifiable event friends want to bet on

---

## How It Works

### User Journey

**1. Registration → 1000 starting credits → Profile setup**

**2. Create or Join Groups**
- Create: "NFL Season 2024" (public/private/invite-only)
- Join: Browse public groups or accept invitations

**3. Create a Bet**
```
Title: "Super Bowl Winner?"
Type: Multiple Choice (Chiefs, 49ers, Bills, Eagles)
Min/Max: 50-500 credits
Deadline: Feb 10, 2024 6:00 PM
Resolution: Consensus Voting
```

**4. Friends Place Bets**
```
Alice: 200 credits → Chiefs
Bob: 150 credits → 49ers
Charlie: 300 credits → Bills
David: 100 credits → Eagles
Total Pool: 750 credits
```

**5. Event Occurs → Chiefs Win**

**6. Resolution**
- Consensus voting: 3 participants vote "Chiefs win"
- Majority reached → Bet resolved

**7. Payouts**
- Alice receives proportional share of 750 credit pool
- Statistics update (wins, streaks, leaderboard)

### Resolution Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **Creator Only** | Bet creator decides outcome | Personal challenges |
| **Assigned Resolver** | Designated trusted judge | Complex predictions needing expert |
| **Consensus Voting** | Democratic majority vote | Objective outcomes everyone can verify |

### Real-Time Features

**WebSocket-powered updates:**
- Group chat messages appear instantly
- Live bet updates push to all members
- Notifications for: new bets, bet resolved, friend requests, group invites

---

## Features

### Bet Types
- **Binary:** Yes/No predictions
- **Multiple Choice:** Up to 4 options
- **Prediction:** Numeric or text predictions
- **Parlay:** Combine multiple predictions
- **Weighted:** Distribute credits across options
- **Pooled:** Winner-takes-all pool

### Group System
**Types:** Public (anyone joins) • Private (invite-only, hidden) • Invite-Only (visible, requires approval)

**Roles:** Admin (full control) • Moderator (manage bets/chat) • Member (create/participate)

### Social Features
- Friend system with requests
- User profiles with statistics (win/loss, streaks, total bets)
- Group leaderboards ranked by credits and win rate
- Activity feeds

### Virtual Economy
- 1000 starting credits for new users
- Win bets to earn credits
- Store system for items/badges
- Transaction history tracking

---

## Technical Architecture

### System Design

```
┌──────────────────────────────────────┐
│   Mobile Clients (iOS/Android/Web)  │
│         React Native + Expo          │
└────────┬─────────────────────┬───────┘
         │ REST API            │ WebSocket
         │ (HTTP)              │ (STOMP)
┌────────▼─────────────────────▼───────┐
│      Spring Boot 3.2 Backend         │
│  ┌──────────┐  ┌──────────────────┐  │
│  │Controllers│  │    Services      │  │
│  │   (REST) │→ │(Business Logic)  │  │
│  └──────────┘  └────────┬─────────┘  │
│                         │             │
│                ┌────────▼─────────┐   │
│                │ JPA Repositories │   │
│                └────────┬─────────┘   │
└─────────────────────────┼─────────────┘
                          │
              ┌───────────┴──────────┐
              │                      │
      ┌───────▼────────┐   ┌─────────▼──────┐
      │  MySQL 8.x     │   │  Redis Cache   │
      │  (Primary DB)  │   │  (Sessions)    │
      └────────────────┘   └────────────────┘
```

### Backend Architecture (Spring Boot)

**Layered Pattern:**
```
Controllers → DTOs → Services → Repositories → Entities
     ↓                ↓            ↓              ↓
  HTTP I/O      Validation   Business      Database
               Request/        Logic         Models
               Response
```

**Core Components:**

**10 Controllers** - REST endpoints
- AuthController, BetController, GroupController, UserController
- MessageController, NotificationController, FriendshipController, StoreController

**16 JPA Entities** - Database models
- User, Group, GroupMembership
- Bet, BetParticipation, BetPrediction, BetResolutionVote, BetResolver
- Message, Notification, Friendship, UserSettings, UserInventory

**Services** - Business logic for all domains (authentication, bets, groups, users, messaging, friendships, notifications, store)

**Design Patterns:**
- Repository Pattern for data access abstraction
- DTO Pattern for API/DB separation
- Service Layer for business logic isolation
- Dependency Injection via Spring IoC
- Event-Driven for notifications
- Strategy Pattern for bet resolution methods

### Frontend Architecture (React Native + Expo)

**File-Based Routing:**
```
app/
├── (auth)/         # Login, Register
├── (tabs)/         # Feed, Groups, Profile, Store
├── bets/
│   ├── [id].tsx    # Dynamic route (bet details)
│   ├── create.tsx
│   └── resolve.tsx
├── groups/
│   ├── [id]/chat.tsx
│   └── create.tsx
└── settings/       # Profile, Security, Notifications
```

**Architecture:**
- **State:** React Context for global state (Auth, User), local state for UI
- **API Layer:** Axios with interceptors for auth token injection
- **WebSocket:** STOMP client with connection management
- **Storage:** expo-secure-store for sensitive data (JWT tokens)
- **Styling:** NativeWind (TailwindCSS for React Native)

### Database Schema (Core Entities)

```sql
users
├── id, username (unique), email (unique)
├── password_hash, credits_balance
├── total_wins, total_losses, current_streak
└── created_at, updated_at

groups
├── id, name, group_type
├── created_by (FK → users)
└── auto_approve_members

group_memberships
├── id, group_id (FK), user_id (FK)
├── role (ADMIN/MODERATOR/MEMBER)
└── joined_at

bets
├── id, title, description, bet_type
├── resolution_method, min/max_bet_amount
├── betting_deadline, status
├── group_id (FK), creator_id (FK)
└── created_at, resolved_at

bet_participations
├── id, bet_id (FK), user_id (FK)
├── amount_wagered, chosen_option
└── payout_amount

bet_resolution_votes
├── id, bet_id (FK), voter_id (FK)
├── voted_option, voted_at

friendships
├── id, user_id (FK), friend_id (FK)
├── status (PENDING/ACCEPTED/BLOCKED)
```

**Relationships:**
- One-to-Many: User → Bets, Group → Bets
- Many-to-Many: Users ↔ Groups (via group_memberships), Users ↔ Bets (via bet_participations)
- Self-referencing: Users ↔ Users (friendships)

### Security Implementation

**JWT Authentication Flow:**
```
1. User credentials → BCrypt validation
2. Generate JWT (24h) + Refresh token (7d)
3. Client stores in secure storage
4. All requests include: Authorization: Bearer <token>
5. Spring Security filter validates token
6. Expired? Use refresh token for new access token
```

**Security Measures:**
- ✅ JWT stateless authentication with refresh tokens
- ✅ BCrypt password hashing (strength 10)
- ✅ Account locking after 5 failed login attempts
- ✅ CORS configuration for cross-origin requests
- ✅ Jakarta Bean Validation on all inputs
- ✅ SQL injection prevention via JPA/Hibernate
- ✅ XSS protection through DTO sanitization

### Real-Time Communication (WebSocket)

**STOMP Protocol:**
```
Client subscribes to:
  /topic/group.{groupId}        → Group chat
  /topic/notifications.{userId}  → Personal notifications
  /topic/bet.{betId}            → Live bet updates
  /user/queue/private           → Private messages

Client sends to:
  /app/chat.send                → Send message
  /app/bet.update               → Update bet
```

---

## Tech Stack & Skills Demonstrated

### Backend

| Technology | Purpose | Skills |
|------------|---------|--------|
| **Spring Boot 3.2** | Application framework | Enterprise Java, IoC/DI, auto-configuration |
| **Spring Security** | Auth & authorization | JWT implementation, RBAC, security best practices |
| **Spring Data JPA** | ORM & data access | Entity design, query optimization, relationships |
| **Hibernate** | JPA implementation | Lazy/eager loading, caching, transactions |
| **MySQL 8.x** | Relational database | SQL, indexing, normalization, ACID compliance |
| **Redis** | Caching & sessions | Performance optimization, distributed cache |
| **Spring WebSocket** | Real-time messaging | WebSocket protocol, STOMP, pub/sub |
| **Maven** | Build automation | Dependency management, build lifecycle |
| **Lombok** | Code generation | Reducing boilerplate, annotations |
| **MapStruct** | DTO mapping | Type-safe object mapping |
| **Jakarta Validation** | Input validation | Custom validators, constraint annotations |
| **SpringDoc OpenAPI** | API documentation | Swagger/OpenAPI spec, API-first design |
| **JUnit 5** | Testing | Unit tests, integration tests, mocking |

### Frontend

| Technology | Purpose | Skills |
|------------|---------|--------|
| **React Native 0.81** | Mobile framework | Cross-platform development, native APIs |
| **Expo SDK 54** | Dev platform | Rapid prototyping, OTA updates, build tools |
| **TypeScript 5.8** | Type safety | Interfaces, generics, type inference, strict mode |
| **Expo Router** | Navigation | File-based routing, deep linking, layouts |
| **NativeWind** | Styling | TailwindCSS, responsive design, utility-first |
| **React Context API** | State management | Global state, providers, hooks |
| **Axios** | HTTP client | Interceptors, retry logic, error handling |
| **@stomp/stompjs** | WebSocket client | Real-time messaging, connection management |
| **expo-secure-store** | Encrypted storage | Mobile security, credential management |

### Advanced Features

**Dynamic Odds Calculation** - Real-time odds based on pool distribution, proportional payouts

**Consensus Voting System** - Democratic resolution with majority rules, conflict handling

**Transaction System** - Atomic credit transfers, balance consistency, audit trail

**RBAC** - Granular permissions per group role, authorization at service layer

**Soft Deletes** - `deletedAt` timestamp pattern, data retention for auditing

**Retry Logic** - Axios exponential backoff, network resilience, offline detection

---

## Installation & Setup

### Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| Java | 17 (LTS) | `brew install openjdk@17` |
| Maven | 3.6+ | `brew install maven` |
| MySQL | 8.x | `brew install mysql` |
| Redis | Latest | `brew install redis` |
| Node.js | 18+ | `brew install node` |

### 1. Clone Repository

```bash
git clone <repository-url>
cd BetMate
```

### 2. Database Setup

```bash
mysql -u root -p
```

```sql
CREATE DATABASE betmate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'betmate_user'@'localhost' IDENTIFIED BY 'YourPassword123!';
GRANT ALL PRIVILEGES ON betmate_db.* TO 'betmate_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Redis Setup

```bash
# Start Redis
brew services start redis

# Verify
redis-cli ping  # Should return: PONG
```

### 4. Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/betmate_db
spring.datasource.username=betmate_user
spring.datasource.password=YourPassword123!

spring.data.redis.host=localhost
spring.data.redis.port=6379

jwt.secret=your-256-bit-secret-change-in-production
```

Build:
```bash
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn clean install
```

### 5. Frontend Configuration

```bash
cd frontend
npm install
```

Update `services/api.ts` with your machine's IP:

```typescript
const API_BASE_URL = 'http://192.168.1.231:8080';  // Change to your IP
const WS_BASE_URL = 'ws://192.168.1.231:8080/ws';
```

Find your IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`

---

## Running the Application

### Start Backend

```bash
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn spring-boot:run
```

Backend runs at `http://localhost:8080`

### Start Frontend

```bash
cd frontend
npx expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code for physical device (Expo Go app)

---

## API Documentation

**Swagger UI:** http://localhost:8080/swagger-ui.html

### Key Endpoints

```http
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

# Users
GET    /api/users/{id}
PUT    /api/users/{id}
GET    /api/users/{id}/statistics

# Groups
GET    /api/groups
POST   /api/groups
GET    /api/groups/{id}
POST   /api/groups/{id}/join
GET    /api/groups/{id}/members
GET    /api/groups/{id}/leaderboard

# Bets
GET    /api/bets
POST   /api/bets
GET    /api/bets/{id}
POST   /api/bets/{id}/participate
POST   /api/bets/{id}/resolve
POST   /api/bets/{id}/vote
GET    /api/bets/group/{groupId}

# Messaging
GET    /api/messages/group/{groupId}
POST   /api/messages/group/{groupId}

# Friendships
GET    /api/friendships
POST   /api/friendships/request
POST   /api/friendships/{id}/accept

# Notifications
GET    /api/notifications
PUT    /api/notifications/{id}/read

# WebSocket
CONNECT /ws
```

All endpoints (except auth) require JWT: `Authorization: Bearer <token>`

---

## Testing

### Backend

```bash
cd backend

# Run all tests
JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn test

# Run specific test
mvn test -Dtest=BetServiceTest

# With coverage
mvn test jacoco:report
```

Tests use H2 in-memory database for isolation.

### Frontend

```bash
cd frontend
npm test
```

---

## Development Workflow

Follows [CLAUDE.md](CLAUDE.md) workflow: **research → plan → implement → validate**

### Build Commands

**Backend:**
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

mvn clean compile              # Compile
mvn test                       # Test
mvn clean install              # Full build
mvn spring-boot:run            # Run
mvn clean install -DskipTests  # Skip tests
```

**Frontend:**
```bash
npm install           # Install deps
npx expo start        # Start dev server
npx expo start -c     # Clear cache
npx tsc --noEmit      # Type check
```

---

## Troubleshooting

### Backend

**Database connection failed:**
```bash
# Verify MySQL running
mysql -u betmate_user -p betmate_db

# Check port
netstat -an | grep 3306
```

**Redis connection failed:**
```bash
redis-cli ping  # Should return PONG
brew services start redis
```

**Java version error:**
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
java -version  # Verify Java 17
```

**Port 8080 in use:**
```bash
lsof -i :8080      # Find process
kill -9 <PID>      # Kill process
# Or change port in application.properties
```

### Frontend

**Cannot connect to backend:**
1. Verify backend is running
2. Update API_BASE_URL with your IP (not localhost)
3. Ensure same WiFi network
4. Check firewall settings

**Expo issues:**
```bash
npx expo start -c              # Clear cache
rm -rf node_modules && npm install  # Reinstall
node -v                        # Verify Node 18+
```

---

## Technical Highlights for Portfolio

✅ **Full-stack proficiency:** Spring Boot (Java 17) + React Native (TypeScript)
✅ **Database design:** 16+ entities with complex relationships, normalization, indexing
✅ **Security:** JWT auth, BCrypt hashing, RBAC, CORS, input validation
✅ **Real-time systems:** WebSocket (STOMP) for live chat and notifications
✅ **Caching:** Redis for performance optimization and session management
✅ **RESTful API:** 50+ endpoints following REST conventions
✅ **Mobile development:** Cross-platform iOS/Android with Expo
✅ **Type safety:** TypeScript with strict mode, interfaces, generics
✅ **State management:** React Context API, secure storage, persistent state
✅ **Transaction handling:** ACID compliance, atomic operations, rollback
✅ **Testing:** Unit tests, integration tests, H2 in-memory DB
✅ **Clean architecture:** Layered design, separation of concerns, DRY
✅ **API documentation:** Swagger/OpenAPI with interactive UI
✅ **Complex business logic:** Odds calculation, consensus voting, payout distribution
✅ **Event-driven:** Application events for decoupled notification system

---

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/name`)
3. Follow [CLAUDE.md](CLAUDE.md) workflow
4. Write tests
5. Commit (`git commit -m 'Add feature'`)
6. Push (`git push origin feature/name`)
7. Open Pull Request

---

## License

[Add license - MIT, Apache 2.0, etc.]

---

**Built with:** Spring Boot • React Native • Expo • MySQL • Redis • TypeScript • Java 17
