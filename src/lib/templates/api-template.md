# API Specification

## Overview

Vault uses **Next.js Server Actions** instead of traditional REST API routes. This provides:
- Type safety between client and server
- Automatic request/response handling
- Built-in CSRF protection
- Simplified data fetching

## Server Actions

### Notes

#### `createNote(formData: FormData)`

Creates a new encrypted note.

**Input (FormData):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Note title (plaintext, for display) |
| encryptedContent | string | Yes | Base64-encoded encrypted content |
| iv | string | Yes | Base64-encoded initialization vector |
| plainText | string | No | Plaintext for embedding generation |

**Returns:**
```typescript
type Result =
  | { success: true; data: EncryptedNote }
  | { success: false; error: ActionError }
```

**Example:**
```typescript
const formData = new FormData();
formData.set('title', 'My Idea');
formData.set('encryptedContent', encryptedBase64);
formData.set('iv', ivBase64);
formData.set('plainText', 'Original content for embedding');

const result = await createNote(formData);
```

---

#### `updateNote(id: string, formData: FormData)`

Updates an existing note.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Note UUID (path param) |
| title | string | No | Updated title |
| encryptedContent | string | Yes | Updated encrypted content |
| iv | string | Yes | New IV (must be unique per encryption) |
| plainText | string | No | Updated plaintext for embedding |

**Returns:**
```typescript
type Result =
  | { success: true; data: EncryptedNote }
  | { success: false; error: ActionError }
```

---

#### `deleteNote(id: string)`

Deletes a note.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Note UUID |

**Returns:**
```typescript
type Result =
  | { success: true; data: void }
  | { success: false; error: ActionError }
```

---

#### `getNotes()`

Retrieves all notes for the authenticated user.

**Returns:**
```typescript
type Result =
  | { success: true; data: EncryptedNote[] }
  | { success: false; error: ActionError }
```

**Note:** Returns encrypted content. Client must decrypt.

---

#### `getNoteById(id: string)`

Retrieves a single note.

**Returns:**
```typescript
type Result =
  | { success: true; data: EncryptedNote }
  | { success: false; error: ActionError }
```

---

### Search

#### `searchNotes(query: string)`

Performs semantic search using vector similarity.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | Yes | Search query text |

**Returns:**
```typescript
type Result =
  | { success: true; data: SearchResult[] }
  | { success: false; error: ActionError }

interface SearchResult {
  note: EncryptedNote;
  similarity: number; // 0-1, higher is more similar
}
```

---

### Incubator

#### `analyzeIdeas(noteIds: string[])`

Sends selected notes to Claude for analysis.

**Input:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| noteIds | string[] | Yes | Array of note UUIDs to analyze |

**Returns:**
```typescript
type Result =
  | { success: true; data: Analysis }
  | { success: false; error: ActionError }

interface Analysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  nextSteps: string[];
}
```

---

#### `generateRoadmap(noteIds: string[])`

Generates a project roadmap from selected notes.

**Returns:**
```typescript
interface Roadmap {
  title: string;
  description: string;
  phases: Phase[];
}

interface Phase {
  name: string;
  duration: string;
  tasks: Task[];
}

interface Task {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}
```

---

## Types

### EncryptedNote

```typescript
interface EncryptedNote {
  id: string;
  userId: string;
  title: string | null;
  encryptedContent: string; // Base64
  iv: string; // Base64
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### ActionError

```typescript
interface ActionError {
  message: string;
  code: ErrorCode;
}

type ErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'DB_ERROR'
  | 'AI_ERROR'
  | 'ENCRYPTION_ERROR'
  | 'UNKNOWN';
```

---

## Error Handling

All Server Actions return a discriminated union:

```typescript
if (!result.success) {
  switch (result.error.code) {
    case 'UNAUTHORIZED':
      redirect('/sign-in');
      break;
    case 'NOT_FOUND':
      notFound();
      break;
    default:
      toast.error(result.error.message);
  }
  return;
}

// Use result.data safely
```

---

## Rate Limits

| Action | Limit | Window |
|--------|-------|--------|
| createNote | 60 | 1 minute |
| searchNotes | 30 | 1 minute |
| analyzeIdeas | 10 | 1 minute |
| generateRoadmap | 5 | 1 minute |
