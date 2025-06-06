import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { getNamespaceType } from './namespace.utils';

describe('namespace.utils', () => {
  describe('getNamespaceType', () => {
    it('detects ZVOL type for paths starting with /dev/zvol/', () => {
      expect(getNamespaceType('/dev/zvol/pool/zvol1')).toBe(NvmeOfNamespaceType.Zvol);
      expect(getNamespaceType('/dev/zvol/mypool/dataset/zvol')).toBe(NvmeOfNamespaceType.Zvol);
    });

    it('detects FILE type for all other paths', () => {
      expect(getNamespaceType('/mnt/pool/file.img')).toBe(NvmeOfNamespaceType.File);
      expect(getNamespaceType('/temp/namespace.file')).toBe(NvmeOfNamespaceType.File);
      expect(getNamespaceType('relative/path/file')).toBe(NvmeOfNamespaceType.File);
      expect(getNamespaceType('')).toBe(NvmeOfNamespaceType.File);
    });
  });
});
