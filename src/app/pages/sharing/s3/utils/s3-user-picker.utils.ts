import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { User, UserFormPreset } from 'app/interfaces/user.interface';
import { DirectoryQueryOptions } from 'app/services/user-directory.service';

/**
 * Users an S3 bucket or access key may belong to: every account except the built-in system ones.
 */
export const s3UserDirectoryOptions: DirectoryQueryOptions = {
  queryParams: new ParamsBuilder<User>()
    .filter('builtin', '=', false)
    .setOptions({ select: ['username', 'id', 'uid'], order_by: ['username'] })
    .getParams(),
};

/**
 * What "Add New" on an S3 user picker opens the user form as.
 *
 * An account created here exists to own a bucket or sign a key, not to log in
 * anywhere: it gets no password, and SMB access is off and locked because an
 * S3 account is not an SMB one — and because the form keeps "Disable Password"
 * untouchable for as long as SMB access is on. Everything else is left at the
 * form's own defaults and stays editable.
 */
export const s3UserFormPreset: UserFormPreset = {
  values: { smb: false, password_disabled: true },
  locked: ['smb'],
};
