import { MiB } from 'app/constants/bytes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import {
  FormNamespaceType, NamespaceFormValue, toNamespaceChanges,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.utils';

describe('toNamespaceChanges', () => {
  const formValue = (overrides: Partial<NamespaceFormValue>): NamespaceFormValue => ({
    device_type: FormNamespaceType.Zvol,
    device_path: '',
    filename: '',
    filesize: null,
    ...overrides,
  });

  it('strips the /dev/ prefix from a zvol path and reports it as a Zvol', () => {
    expect(toNamespaceChanges(formValue({
      device_type: FormNamespaceType.Zvol,
      device_path: '/dev/zvol/tank/test-zvol',
    }))).toEqual({
      device_path: 'zvol/tank/test-zvol',
      device_type: NvmeOfNamespaceType.Zvol,
      filesize: undefined,
    });
  });

  it('passes an existing file path through unchanged and reports it as a File', () => {
    expect(toNamespaceChanges(formValue({
      device_type: FormNamespaceType.ExistingFile,
      device_path: '/mnt/tank/test-file',
    }))).toEqual({
      device_path: '/mnt/tank/test-file',
      device_type: NvmeOfNamespaceType.File,
      filesize: undefined,
    });
  });

  it('joins directory and filename for a new file and keeps its size', () => {
    expect(toNamespaceChanges(formValue({
      device_type: FormNamespaceType.NewFile,
      device_path: '/mnt/tank',
      filename: 'new-file.img',
      filesize: 1024 * MiB,
    }))).toEqual({
      device_path: '/mnt/tank/new-file.img',
      device_type: NvmeOfNamespaceType.File,
      filesize: 1024 * MiB,
    });
  });

  it('does not double the separator when the new file directory has a trailing slash', () => {
    expect(toNamespaceChanges(formValue({
      device_type: FormNamespaceType.NewFile,
      device_path: '/mnt/tank/',
      filename: 'new-file.img',
      filesize: 1024 * MiB,
    })).device_path).toBe('/mnt/tank/new-file.img');
  });

  it('drops filesize for anything that is not a new file', () => {
    expect(toNamespaceChanges(formValue({
      device_type: FormNamespaceType.ExistingFile,
      device_path: '/mnt/tank/test-file',
      filesize: 1024 * MiB,
    })).filesize).toBeUndefined();
  });
});
