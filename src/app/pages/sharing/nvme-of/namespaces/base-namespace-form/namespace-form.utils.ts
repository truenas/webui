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
 *
 * The group is satisfiable the moment it is built: `filename` / `filesize` start disabled, which
 * matches the default Zvol device type. {@link syncNewFileControls} keeps them in step from there.
 */
export function createNamespaceForm(formBuilder: NonNullableFormBuilder): NamespaceFormGroup {
  return formBuilder.group({
    device_type: [FormNamespaceType.Zvol],
    device_path: ['', Validators.required],
    // Required only on the New File branch — see `syncNewFileControls`, which is what makes that
    // conditional. Declaring the validator here (rather than relying on the rendered input's
    // native `required`) is what lets `tn-form-field` infer the visual `*` — it checks
    // `control.hasValidator(Validators.required)`.
    filename: [{ value: '', disabled: true }, Validators.required],
    filesize: [{ value: null as number | null, disabled: true }, Validators.required],
  });
}

/**
 * Keeps `filename` / `filesize` — which only the New File branch renders — out of the group's
 * validity on every other branch. Disabling excludes them from group validity;
 * {@link toNamespaceChanges} reads `getRawValue()`, so nothing is lost from the payload.
 *
 * Two independent reasons both make this necessary, so don't drop it after fixing only one:
 *
 * 1. {@link createNamespaceForm} declares `Validators.required` on both unconditionally (it has
 *    to — that's what `tn-form-field` reads to infer the `*`). This function is the other half of
 *    that: a group built there but never passed through here is permanently INVALID off New File.
 *
 * 2. Angular does not, in this setup, remove the `required` validator that a destroyed `tn-input`
 *    contributed — its `[required]` binding also matches Angular's own `RequiredValidator`
 *    directive, and `cleanUpValidators` fails to filter it back off. Verified empirically: with
 *    both validators removed from the factory AND nothing disabled, switching New File → Existing
 *    File still leaves `filename`/`filesize` holding `{ required: true }`. So even a factory that
 *    declared no validators would strand a user who merely *visited* New File, unable to save a
 *    Zvol or Existing File namespace afterwards.
 */
export function syncNewFileControls(form: NamespaceFormGroup, type: FormNamespaceType): void {
  const { filename, filesize } = form.controls;

  if (type === FormNamespaceType.NewFile) {
    filename.enable();
    filesize.enable();
  } else {
    filename.disable();
    filesize.disable();
  }
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
