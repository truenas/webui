import { UserFormPreset } from 'app/interfaces/user.interface';
import { DirectoryQueryOptions } from 'app/services/user-directory.service';

/**
 * Users an S3 bucket or access key may belong to: every account except the built-in system ones.
 */
export const s3UserDirectoryOptions: DirectoryQueryOptions = {
  queryParams: [
    [['builtin', '=', false]],
    { select: ['username', 'id', 'uid'], order_by: ['username'] },
  ],
};

/**
 * The preset "Add New" on an S3 user picker opens the user form with. Such an account owns a bucket
 * or signs a key rather than logging in, so it starts without a password or SMB access; neither is
 * locked. SMB must be turned off first, since the form holds "Disable Password" off while SMB is on;
 * the form applies them in that order (see {@link UserFormPreset}).
 */
export const s3UserFormPreset: UserFormPreset = {
  values: { smb: false, password_disabled: true },
};
