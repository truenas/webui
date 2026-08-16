import {
  AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ValidatorFn, Validators,
} from '@angular/forms';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';

/** Smallest file the New File branch may ask for, in bytes — the input models a size, not a count. */
export const minimumFilesize = 1;

/**
 * Built once: `Validators.min` returns a fresh closure per call, and `removeValidators` matches by
 * reference — a per-call instance would never be removed, and would stack up another copy on every
 * return to the New File branch.
 */
const minimumFilesizeValidator = Validators.min(minimumFilesize);

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
 * `filename` / `filesize` belong to the New File branch only, so they start inert — disabled and
 * unvalidated, matching the default Zvol device type. {@link syncNewFileControls} owns both halves
 * of their state from there, which is what keeps the group satisfiable on every branch.
 */
export function createNamespaceForm(formBuilder: NonNullableFormBuilder): NamespaceFormGroup {
  return formBuilder.group({
    device_type: [FormNamespaceType.Zvol],
    device_path: ['', Validators.required],
    filename: [{ value: '', disabled: true }],
    filesize: [{ value: null as number | null, disabled: true }],
  });
}

/**
 * Puts `filename` / `filesize` in step with the selected device type: validated and editable on the
 * New File branch (the only branch that renders them), inert everywhere else.
 *
 * Owning the validators here — rather than declaring them once in {@link createNamespaceForm} — is
 * what makes the group self-consistent: no state has a control carrying `required` that no visible
 * input can satisfy, while the branch that does render them still gets the `*` that `tn-form-field`
 * infers from the validator.
 *
 * `filesize` carries a floor on top of `required`, because `required` only rejects null/empty — it
 * lets a typed `0` through, and a zero-byte file is not a namespace the API can serve.
 *
 * Leaving the branch also CLEARS them, mirroring the `device_path` reset the caller does on every
 * device-type change: {@link toNamespaceChanges} reads `getRawValue()`, so without the reset a
 * disabled leftover stays in the payload and New File → Zvol → New File silently resurrects values
 * the user last saw two branches ago.
 */
export function syncNewFileControls(form: NamespaceFormGroup, type: FormNamespaceType): void {
  const { filename, filesize } = form.controls;
  const isNewFile = type === FormNamespaceType.NewFile;

  const branchValidators: [AbstractControl, ValidatorFn[]][] = [
    [filename, [Validators.required]],
    [filesize, [Validators.required, minimumFilesizeValidator]],
  ];

  for (const [control, validators] of branchValidators) {
    if (isNewFile) {
      control.addValidators(validators);
      control.enable();
    } else {
      control.removeValidators(validators);
      control.reset();
      control.disable();
    }

    // add/removeValidators only swap the validator, they never re-run it — Angular requires an
    // explicit recompute. `enable()` / `disable()` above happen to do one, but they are here for
    // the branch's *editability*, so relying on them would tie this function's correctness to a
    // call that a later refactor could reasonably drop, leaving the status silently stale.
    control.updateValueAndValidity();
  }
}

export function toNamespaceChanges(value: NamespaceFormValue): NamespaceChanges {
  let path = '';

  switch (value.device_type) {
    case FormNamespaceType.Zvol:
      // Anchored: the API wants the `zvol/…` form, and only a LEADING `/dev/` is the device prefix.
      // The Zvol explorer is rooted at `zvolsRootNode`, so the prefix is always leading today —
      // anchoring keeps a dataset legitimately named `.../dev/zvol/...` from being rewritten.
      path = value.device_path.replace(/^\/dev\/zvol\//, 'zvol/');
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
