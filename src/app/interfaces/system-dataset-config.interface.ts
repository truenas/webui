export interface SystemDatasetConfig {
  id: number;
  basename: string;
  is_decrypted: boolean;
  path: string;
  pool: string;
  uuid: string;
  uuid_a: string;
  uuid_b: string;
}

export interface SystemDatasetUpdate {
  pool?: string;
  pool_exclude?: string;
}
