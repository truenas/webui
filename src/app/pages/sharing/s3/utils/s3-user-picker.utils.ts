import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { User, UserFormPreset } from 'app/interfaces/user.interface';
import { UserPickerProvider } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker-provider';

/**
 * Users an S3 bucket or access key may belong to: every account except the built-in system ones.
 * Must be called in an injection context, as the provider injects the API service.
 */
export function createS3UserPickerProvider(): UserPickerProvider {
  return new UserPickerProvider({
    queryParams: new ParamsBuilder<User>()
      .filter('builtin', '=', false)
      .setOptions({ select: ['username', 'id', 'uid'], order_by: ['username'] })
      .getParams(),
  });
}

/**
 * What "Add New" on an S3 user picker opens the user form as.
 *
 * An account created here exists to own a bucket or sign a key rather than to
 * log in anywhere, so it starts with no password and without SMB access. Both
 * are starting points, not rules — nothing here is locked, and an admin who
 * does want an SMB account for the same person can just tick it, which turns
 * the password back on, because SMB authenticates with one.
 *
 * SMB has to be the one that starts off, though: the form holds "Disable
 * Password" off and untouchable for as long as SMB access is on, so the two
 * only land the way this asks for them in that order. The form applies them
 * in it; see {@link UserFormPreset}.
 */
export const s3UserFormPreset: UserFormPreset = {
  values: { smb: false, password_disabled: true },
};
