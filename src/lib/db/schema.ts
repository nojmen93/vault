export interface DbUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DbNote {
  id: string;
  user_id: string;
  title: string | null;
  encrypted_content: string;
  iv: string;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface MatchNotesResult {
  id: string;
  user_id: string;
  title: string | null;
  encrypted_content: string;
  iv: string;
  similarity: number;
}
