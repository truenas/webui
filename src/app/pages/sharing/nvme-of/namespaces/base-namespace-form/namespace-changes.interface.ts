import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';

export interface NamespaceChanges {
  device_path: string;
  device_type: NvmeOfNamespaceType;
  filesize: number | null;
  enabled: boolean;
}
