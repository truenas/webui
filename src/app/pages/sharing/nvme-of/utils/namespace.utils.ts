import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';

/**
 * Detects the namespace type based on the device path.
 * ZVOL paths start with '/dev/zvol/', everything else is treated as FILE.
 */
export function getNamespaceType(devicePath: string): NvmeOfNamespaceType {
  if (devicePath.startsWith('/dev/zvol/')) {
    return NvmeOfNamespaceType.Zvol;
  }
  return NvmeOfNamespaceType.File;
}
