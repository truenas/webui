import { FormControl, FormGroup, Validators } from '@angular/forms';
import { S3Access, S3PrincipalType } from 'app/enums/s3.enum';
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
  access: FormControl<S3Access>;
}>;

export function createS3GrantFormGroup(grant?: S3GrantEntry): S3GrantFormGroup {
  const principalType = grant?.principal_type ?? S3PrincipalType.User;
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
    access: new FormControl(grant?.access ?? S3Access.ReadOnly, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
}

export function toS3Grants(groups: S3GrantFormGroup[]): S3Grant[] {
  return groups.map((group) => {
    const { principal_type: principalType, xid, access } = group.getRawValue();
    return {
      principal_type: principalType,
      xid: principalType === S3PrincipalType.Everyone ? null : xid,
      access,
    };
  });
}
