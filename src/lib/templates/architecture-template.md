# Architecture

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | {framework} | {framework_purpose} |
| Auth | {auth} | User authentication & management |
| Database | {database} | Data persistence |
| UI | {ui_framework} | Styling & components |
| Deployment | {deployment} | Hosting & infrastructure |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   {app}     │  │   State     │  │     Local Storage       │  │
│  │     App     │  │  Management │  │   (user preferences)    │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          │ HTTPS          │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Server                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   API       │  │   Auth      │  │     Business Logic      │  │
│  │   Routes    │  │  Middleware │  │                         │  │
│  └──────┬──────┘  └─────────────┘  └───────────┬─────────────┘  │
└─────────┼─────────────────────────────────────┼─────────────────┘
          │                                      │
          ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────────────┐
│       Auth          │              │         Database            │
│  (Authentication)   │              │  ┌─────────────────────┐    │
│                     │              │  │    Tables           │    │
│  - User management  │              │  │  - users            │    │
│  - Session tokens   │              │  │  - {domain_tables}  │    │
│  - OAuth providers  │              │  └─────────────────────┘    │
└─────────────────────┘              └─────────────────────────────┘
```

## Data Flow

### {primary_action}

```
1. User initiates action
2. Client validates input
3. Request sent to server
4. Server authenticates request
5. Business logic executes
6. Data persisted to database
7. Response returned to client
```

## Directory Structure

```
{project_name}/
├── src/
│   ├── app/                  # Application routes
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components
│   │   └── {feature}/        # Feature-specific components
│   ├── lib/                  # Utilities and helpers
│   ├── actions/              # Server actions
│   └── types/                # TypeScript types
├── public/                   # Static assets
└── tests/                    # Test files
```

## Key Design Decisions

1. **{decision_1}**: {rationale_1}
2. **{decision_2}**: {rationale_2}
3. **{decision_3}**: {rationale_3}

## Security Considerations

- All API endpoints require authentication
- Input validation on both client and server
- Rate limiting on sensitive endpoints
- Environment variables for secrets
- HTTPS only in production
