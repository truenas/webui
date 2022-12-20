export interface DatasetUnlockFormValues {
  unlock_children: boolean;
  use_file: boolean;
  file: File[];
  key: string;
  datasets: {
    key?: string;
    passphrase?: string;
    name: string;
    is_passphrase: boolean;
    file?: File[];
  }[];
  force: boolean;
}
