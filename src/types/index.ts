export interface Note {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedNote {
  id: string;
  userId: string;
  title: string | null;
  encryptedContent: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface ActionError {
  message: string;
  code?: string;
}
