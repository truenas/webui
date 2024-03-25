export interface VolumeData {
  avail?: number;
  id?: number | string;
  is_decrypted?: boolean;
  is_upgraded?: boolean;
  mountpoint?: string;
  name?: string;
  status?: string;
  used?: number;
  used_pct?: string;
  vol_encrypt?: number;
  vol_encryptkey?: string;
  vol_guid?: string;
  vol_name?: string;
}

export type VolumesData = Map<string, VolumeData>;
