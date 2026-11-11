// Shared shapes for meeting books (API ↔ UI ↔ PDF builder).

export interface BookCover {
  /** Overrides; empty fields fall back to the meeting's own data. */
  title?: string;
  subtitle?: string;
  reference?: string;
  classification?: string; // e.g. "CONFIDENTIAL"
  preparedBy?: string;
  note?: string;
}

export interface BookDocument {
  id: number;
  name: string;
  file_type: string;
  file_url: string;
  file_size: number;
}

export interface BookSection {
  id: number;
  order: number;
  title: string;
  description?: string | null;
  ministry?: string | null;
  presenter?: string | null;
  status?: string | null;
  approvalRequired?: boolean;
  documents: BookDocument[];
}

export interface MeetingBookData {
  meeting: {
    id: number;
    name: string;
    type?: string | null;
    start_at?: string | null;
    end_at?: string | null;
    location?: string | null;
    status?: string | null;
    description?: string | null;
    chair?: string | null;
  };
  org: { name: string; slogan?: string | null; logo?: string | null };
  cover: BookCover;
  sections: BookSection[];
  updatedAt: string;
}

export const CLASSIFICATIONS = ['UNCLASSIFIED', 'RESTRICTED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'];
