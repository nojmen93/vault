# Security

## Encryption Architecture

### Overview

Vault uses **client-side encryption** to ensure that note content is never visible to the server in plaintext. The encryption happens entirely in the browser before any data is transmitted.

```
User Password
     │
     ▼
┌─────────────┐
│   PBKDF2    │ ◄── Salt (stored locally)
│  100,000    │
│ iterations  │
└─────────────┘
     │
     ▼
  AES-256 Key
     │
     ▼
┌─────────────┐
│  AES-256    │ ◄── IV (random per encryption)
│    GCM      │
└─────────────┘
     │
     ▼
Ciphertext + Auth Tag
```

### Encryption Details

| Parameter | Value |
|-----------|-------|
| Algorithm | AES-256-GCM |
| Key Derivation | PBKDF2-SHA256 |
| KDF Iterations | 100,000 |
| Salt Size | 16 bytes |
| IV Size | 12 bytes |
| Key Size | 256 bits |

### Key Derivation

```typescript
// User's password + random salt → encryption key
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: salt,
    iterations: 100000,
    hash: 'SHA-256',
  },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### Encryption Process

```typescript
// Each encryption uses a unique IV
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  plaintext
);
```

### What's Stored Where

| Data | Location | Encrypted? |
|------|----------|------------|
| Note content | Supabase | Yes (AES-256-GCM) |
| Note title | Supabase | No (for display) |
| IV | Supabase | No (needed for decryption) |
| Embeddings | Supabase | No (vectors only, no plaintext) |
| Salt | Browser localStorage | No |
| Encryption key | Browser memory | Never stored |

---

## Authentication

### Clerk Integration

- All authentication handled by Clerk
- Session tokens validated server-side
- Protected routes require valid session

### Route Protection

```typescript
// src/middleware.ts
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

### Server Action Protection

```typescript
// Every server action verifies auth
export async function createNote(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: { code: 'UNAUTHORIZED' } };
  }
  // ... proceed with authenticated user
}
```

---

## Database Security

### Row Level Security (RLS)

Supabase RLS ensures users can only access their own data:

```sql
CREATE POLICY "Users can CRUD own notes" ON notes
  FOR ALL USING (user_id = current_setting('app.current_user_id', true));
```

### Service Role Key

- Only used server-side in Server Actions
- Never exposed to client
- Stored in environment variables

---

## API Keys & Secrets

### Environment Variables

| Variable | Purpose | Exposure |
|----------|---------|----------|
| `CLERK_SECRET_KEY` | Clerk auth | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | DB admin | Server only |
| `OPENAI_API_KEY` | Embeddings | Server only |
| `ANTHROPIC_API_KEY` | Claude | Server only |
| `NEXT_PUBLIC_*` | Public config | Client allowed |

### Never Commit Secrets

`.gitignore` excludes:
```
.env.local
.env*.local
```

---

## Threat Model

### What We Protect Against

| Threat | Mitigation |
|--------|------------|
| Server breach | Content encrypted client-side |
| Man-in-the-middle | HTTPS + encryption |
| Database leak | Encrypted content, no plaintext |
| Session hijacking | Clerk secure sessions |
| XSS | React escaping, CSP headers |
| CSRF | Server Actions built-in protection |

### What We Don't Protect Against

| Threat | Reason |
|--------|--------|
| Compromised device | User responsibility |
| Weak password | User responsibility |
| Clipboard attacks | OS-level security |
| Key extraction from memory | Requires device access |

---

## Embedding Privacy

### The Trade-off

Embeddings enable semantic search but are derived from plaintext. Our approach:

1. Plaintext sent to OpenAI for embedding generation
2. Only the embedding (1536-dimension vector) is stored
3. Plaintext is immediately discarded after embedding
4. Embeddings cannot be reversed to plaintext

### Future Consideration

- Local embedding models (eliminates OpenAI dependency)
- Homomorphic encryption for embeddings (research stage)

---

## Security Checklist

- [x] Client-side encryption (AES-256-GCM)
- [x] PBKDF2 key derivation (100k iterations)
- [x] Unique IV per encryption
- [x] Clerk authentication
- [x] Supabase RLS policies
- [x] Environment variable secrets
- [x] HTTPS enforcement
- [ ] CSP headers (in progress)
- [ ] Rate limiting (planned)
- [ ] Security audit (planned)

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please email: security@vault.app

Do not open a public issue for security vulnerabilities.
