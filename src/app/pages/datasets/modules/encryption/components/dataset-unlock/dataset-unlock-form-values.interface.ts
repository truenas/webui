export interface DatasetUnlockFormValues {
  unlock_children: boolean;
  key_file: boolean;
  file: File;
  datasets: {
    key?: string;
    passphrase?: string;
    name: string;
    is_passphrase: boolean;
  }[];
  force: boolean;
}
