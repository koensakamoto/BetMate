# DTO Organization Structure

This directory contains all Data Transfer Objects (DTOs) organized by domain with a consistent structure.

## Structure

```
dto/
├── user/                     # User management & profiles
│   ├── request/
│   │   ├── UserRegistrationRequestDto.java
│   │   ├── UserProfileUpdateRequestDto.java
│   │   └── UserAvailabilityCheckRequestDto.java
│   └── response/
│       ├── UserProfileResponseDto.java
│       ├── UserSearchResultResponseDto.java
│       └── UserAvailabilityResponseDto.java
├── store/                    # Store items & inventory
│   ├── request/
│   │   ├── EquipItemRequestDto.java
│   │   ├── PurchaseItemRequestDto.java
│   │   └── RemoveItemRequestDto.java
│   └── response/
│       ├── InventoryItemResponseDto.java
│       ├── EquippedItemResponseDto.java
│       ├── InventorySummaryResponseDto.java
│       ├── UserLoadoutResponseDto.java
│       └── PopularItemResponseDto.java
├── betting/                  # Betting system
│   ├── request/
│   │   └── .gitkeep         # Ready for bet creation, participation DTOs
│   └── response/
│       └── .gitkeep         # Ready for bet results, statistics DTOs
├── group/                    # Group management
│   ├── request/
│   │   └── .gitkeep         # Ready for group creation, membership DTOs
│   └── response/
│       └── .gitkeep         # Ready for group info, member list DTOs
├── messaging/                # Messages & notifications
│   ├── request/
│   │   └── .gitkeep         # Ready for message sending DTOs
│   └── response/
│       └── .gitkeep         # Ready for message history DTOs
├── auth/                     # Authentication & security
│   ├── request/
│   │   └── .gitkeep         # Ready for login, token refresh DTOs
│   └── response/
│       └── .gitkeep         # Ready for JWT token, auth status DTOs
└── common/                   # Shared DTOs across domains
    └── .gitkeep             # Ready for pagination, error DTOs
```

## Naming Conventions

### Request DTOs
- Format: `{Action}{Domain}RequestDto.java`
- Examples: 
  - `UserRegistrationRequestDto.java`
  - `BetCreationRequestDto.java`
  - `GroupJoinRequestDto.java`

### Response DTOs  
- Format: `{Entity}{Context}ResponseDto.java`
- Examples:
  - `UserProfileResponseDto.java`
  - `BetDetailsResponseDto.java`
  - `GroupMemberResponseDto.java`

## Domain Guidelines

### When to Create a New Domain
- The entity has its own repository and service layer
- The functionality is logically distinct from existing domains
- Multiple controllers would need these DTOs

### Domain Responsibilities

#### `user/`
- User registration, authentication, profile management
- User search, statistics, account operations

#### `store/`
- Store item browsing, purchasing
- Inventory management, item equipping
- Store analytics and popular items

#### `betting/`
- Bet creation, participation, resolution
- Bet history, statistics, leaderboards

#### `group/`
- Group creation, management, membership
- Group permissions, invitations, settings

#### `messaging/`
- Direct messages, group chat
- Notifications, message history

#### `auth/`
- Login, logout, token management
- Password reset, email verification
- Session management

#### `common/`
- Pagination wrappers
- Error responses
- Generic status responses
- Shared validation DTOs

## Usage Examples

```java
// Import request DTOs
import com.circlebet.dto.user.request.UserRegistrationRequestDto;
import com.circlebet.dto.store.request.PurchaseItemRequestDto;

// Import response DTOs  
import com.circlebet.dto.user.response.UserProfileResponseDto;
import com.circlebet.dto.store.response.InventoryItemResponseDto;

// Import common DTOs
import com.circlebet.dto.common.PagedResponseDto;
import com.circlebet.dto.common.ErrorResponseDto;
```

## Benefits

- **Domain Separation**: Clear boundaries between business domains
- **Scalability**: Easy to add new domains without affecting existing structure
- **Discoverability**: Developers can quickly find relevant DTOs
- **Consistency**: Uniform naming and organization across the application
- **Maintainability**: Related DTOs are grouped together
- **IDE Support**: Better autocomplete and refactoring capabilities