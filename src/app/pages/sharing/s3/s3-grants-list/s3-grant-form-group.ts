import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  S3Access, S3GrantAccessChoice, S3GrantAction, S3PrincipalType, s3GrantCustomAccess,
} from 'app/enums/s3.enum';
import { S3Grant, S3GrantEntry } from 'app/interfaces/s3.interface';

export type S3GrantFormGroup = FormGroup<{
  principal_type: FormControl<S3PrincipalType>;
  /**
   * uid or gid of the principal. Disabled, and so excluded from validation, for `EVERYONE`.
   */
  xid: FormControl<number | null>;
  /**
   * Resolved principal name for display only. Never submitted.
   */
  name: FormControl<string>;
  /**
   * A preset, or `CUSTOM` when the grant lists its own actions in `actions`.
   */
  access: FormControl<S3GrantAccessChoice>;
  /**
   * The actions a `CUSTOM` grant allows. Disabled, and so excluded from validation, for a preset.
   */
  actions: FormControl<S3GrantAction[]>;
}>;

export function createS3GrantFormGroup(grant?: S3GrantEntry): S3GrantFormGroup {
  const principalType = grant?.principal_type ?? S3PrincipalType.User;
  const access = grant?.access ?? S3Access.ReadOnly;
  const isCustom = Array.isArray(access);
  return new FormGroup({
    principal_type: new FormControl(principalType, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    xid: new FormControl<number | null>(
      { value: grant?.xid ?? null, disabled: principalType === S3PrincipalType.Everyone },
      [Validators.required],
    ),
    name: new FormControl(grant?.name ?? '', { nonNullable: true }),
    access: new FormControl<S3GrantAccessChoice>(isCustom ? s3GrantCustomAccess : access, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    actions: new FormControl<S3GrantAction[]>(
      { value: isCustom ? [...access] : [], disabled: !isCustom },
      { nonNullable: true, validators: [Validators.required] },
    ),
  });
}

/**
 * Enables the action list for `CUSTOM` and disables it for a preset, so a row's validity never depends on a
 * field that is not shown.
 */
export function syncS3GrantActions(group: S3GrantFormGroup): void {
  const actions = group.controls.actions;
  if (group.controls.access.value === s3GrantCustomAccess) {
    actions.enable({ emitEvent: false });
  } else {
    actions.disable({ emitEvent: false });
  }
}

export function toS3Grants(groups: S3GrantFormGroup[]): S3Grant[] {
  return groups.map((group) => {
    const {
      principal_type: principalType, xid, access, actions,
    } = group.getRawValue();
    return {
      principal_type: principalType,
      xid: principalType === S3PrincipalType.Everyone ? null : xid,
      access: access === s3GrantCustomAccess ? actions : access,
    };
  });
}
