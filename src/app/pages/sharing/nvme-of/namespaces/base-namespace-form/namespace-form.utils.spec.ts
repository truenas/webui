import { FormBuilder } from '@angular/forms';
import { MiB } from 'app/constants/bytes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import {
  createNamespaceForm, FormNamespaceType, NamespaceFormValue, syncNewFileControls, toNamespaceChanges,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.utils';

describe('createNamespaceForm', () => {
  // The New File controls start inert — no `required`, disabled — so a host that never renders
  // BaseNamespaceFormComponent (and so never runs `syncNewFileControls`) can still reach VALID.
  it('returns a group that only needs a device path to become valid', () => {
    const form = createNamespaceForm(new FormBuilder().nonNullable);

    expect(form.status).toBe('INVALID');
    expect(form.controls.filename.disabled).toBe(true);
    expect(form.controls.filesize.disabled).toBe(true);

    form.controls.device_path.setValue('/mnt/tank/test-file');

    expect(form.status).toBe('VALID');
  });
});

describe('syncNewFileControls', () => {
  const setUp = (type: FormNamespaceType): ReturnType<typeof createNamespaceForm> => {
    const form = createNamespaceForm(new FormBuilder().nonNullable);
    form.controls.device_path.setValue('/mnt/tank');
    syncNewFileControls(form, type);
    return form;
  };

  it('requires filename and file size on the New File branch', () => {
    const form = setUp(FormNamespaceType.NewFile);

    expect(form.status).toBe('INVALID');

    form.patchValue({ filename: 'new-file.img', filesize: 1024 * MiB });

    expect(form.status).toBe('VALID');
  });

  // `Validators.required` only rejects null/empty, so a typed 0 would otherwise reach the API as a
  // zero-byte file.
  it('rejects a zero file size', () => {
    const form = setUp(FormNamespaceType.NewFile);
    form.patchValue({ filename: 'new-file.img', filesize: 0 });

    expect(form.controls.filesize.errors).toEqual({ min: { min: 1, actual: 0 } });
    expect(form.status).toBe('INVALID');
  });

  it.each([FormNamespaceType.Zvol, FormNamespaceType.ExistingFile])(
    'takes filename and file size out of validity on %s',
    (type) => {
      const form = setUp(FormNamespaceType.NewFile);
      syncNewFileControls(form, type);

      expect(form.status).toBe('VALID');
      expect(form.controls.filename.disabled).toBe(true);
      expect(form.controls.filesize.disabled).toBe(true);

      // Every validator goes, not just `required` — a leftover would also mean the New File branch
      // stacks a second copy of it on the way back.
      expect(form.controls.filename.validator).toBeNull();
      expect(form.controls.filesize.validator).toBeNull();
    },
  );

  // `toNamespaceChanges` reads `getRawValue()`, so a disabled leftover would still ship — and would
  // reappear in the inputs on the way back to New File.
  it('clears filename and file size when leaving the New File branch', () => {
    const form = setUp(FormNamespaceType.NewFile);
    form.patchValue({ filename: 'new-file.img', filesize: 1024 * MiB });

    syncNewFileControls(form, FormNamespaceType.Zvol);

    expect(form.getRawValue()).toMatchObject({ filename: '', filesize: null });

    syncNewFileControls(form, FormNamespaceType.NewFile);

    expect(form.getRawValue()).toMatchObject({ filename: '', filesize: null });
  });
});

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

  // Only a leading `/dev/` is the device prefix; a dataset that happens to contain the same
  // segments keeps them.
  it('only strips the /dev/ prefix when it leads the zvol path', () => {
    expect(toNamespaceChanges(formValue({
      device_type: FormNamespaceType.Zvol,
      device_path: '/dev/zvol/tank/dev/zvol/nested',
    })).device_path).toBe('zvol/tank/dev/zvol/nested');

    expect(toNamespaceChanges(formValue({
      device_type: FormNamespaceType.Zvol,
      device_path: 'zvol/tank/dev/zvol/nested',
    })).device_path).toBe('zvol/tank/dev/zvol/nested');
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
