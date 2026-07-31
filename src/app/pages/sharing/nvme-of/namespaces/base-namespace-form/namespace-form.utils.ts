import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';

/**
 * Device type as the *form* models it — one option finer than the API's {@link NvmeOfNamespaceType},
 * because a brand-new file needs a parent directory + filename + size while an existing file needs
 * only a path. {@link toNamespaceChanges} collapses the two file variants back to `File`.
 */
export enum FormNamespaceType {
  Zvol = 'Zvol',
  NewFile = 'NewFile',
  ExistingFile = 'ExistingFile',
}

export type NamespaceFormGroup = FormGroup<{
  device_type: FormControl<FormNamespaceType>;
  device_path: FormControl<string>;
  filename: FormControl<string>;
  filesize: FormControl<number | null>;
}>;

export type NamespaceFormValue = ReturnType<NamespaceFormGroup['getRawValue']>;

/**
 * Builds the namespace form group. Owned by the side-panel *wrapper* rather than by
 * {@link BaseNamespaceFormComponent} so the wrapper can hand the same instance to `<ix-form>`'s
 * `[formGroup]` — a `viewChild`-owned group resolves too late for a required input.
 */
export function createNamespaceForm(formBuilder: NonNullableFormBuilder): NamespaceFormGroup {
  return formBuilder.group({
    device_type: [FormNamespaceType.Zvol],
    device_path: ['', Validators.required],
    // Required only on the New File branch; `BaseNamespaceFormComponent` disables both elsewhere,
    // which takes them out of the group's validity. Declaring the validator here (rather than
    // relying on the rendered input's native `required`) is what lets `tn-form-field` infer the
    // visual `*` — it checks `control.hasValidator(Validators.required)`.
    filename: ['', Validators.required],
    filesize: [null as number | null, Validators.required],
  });
}

/**
 * Derives the API-shaped namespace changes from the form value: resolves the device path per
 * device type (zvol paths lose their `/dev/` prefix, a new file is directory + filename) and
 * carries `filesize` only where it applies.
 */
export function toNamespaceChanges(value: NamespaceFormValue): NamespaceChanges {
  let path = '';

  switch (value.device_type) {
    case FormNamespaceType.Zvol:
      path = value.device_path.replace('/dev/zvol/', 'zvol/');
      break;
    case FormNamespaceType.NewFile: {
      const directory = value.device_path.replace(/\/$/, '');
      path = `${directory}/${value.filename}`;
      break;
    }
    default:
      path = value.device_path;
      break;
  }

  return {
    device_path: path,
    device_type: value.device_type === FormNamespaceType.Zvol ? NvmeOfNamespaceType.Zvol : NvmeOfNamespaceType.File,
    filesize: value.device_type === FormNamespaceType.NewFile ? value.filesize : undefined,
  };
}
