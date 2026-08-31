export type BackupMeta = {
  id: string;
  created_at: string;
  created_by?: string;
  database: string;
  schema: string;
  format: string;
  version: number;
  size_bytes: number;
  table_counts: Record<string, number>;
  tables: string[];
  filename: string;
};

export type BackupListResponse = {
  items: BackupMeta[];
};

export type BackupTablesResponse = {
  tables: string[];
};
