import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';

export interface NewNamespace {
  device_path: string;
  device_type: NvmeOfNamespaceType;
}
