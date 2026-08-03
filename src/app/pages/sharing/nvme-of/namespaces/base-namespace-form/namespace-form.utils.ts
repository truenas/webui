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
 * Puts `filename` / `filesize` in step with the selected device type: required and editable on the
 * New File branch (the only branch that renders them), inert everywhere else.
 *
 * Owning the validator here — rather than declaring it once in {@link createNamespaceForm} — is
 * what makes the group self-consistent: there is no state in which a control carries `required`
 * but no input can satisfy it, so a group built by the factory is valid on every branch without
 * depending on this having run. `tn-form-field` still infers the visual `*` from
 * `hasValidator(Validators.required)`, and only ever renders while the branch is active.
 *
 * Disabling as well as unvalidating is belt-and-braces: it keeps the controls out of group
 * validity even if something else attaches a validator (e.g. a stray `[required]` binding, which
 * also matches Angular's `RequiredValidator` directive). {@link toNamespaceChanges} reads
 * `getRawValue()`, so disabling loses nothing from the payload.
 */
export function syncNewFileControls(form: NamespaceFormGroup, type: FormNamespaceType): void {
  const { filename, filesize } = form.controls;
  const isNewFile = type === FormNamespaceType.NewFile;

  for (const control of [filename, filesize]) {
    if (isNewFile) {
      control.addValidators(Validators.required);
      control.enable();
    } else {
      control.removeValidators(Validators.required);
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
