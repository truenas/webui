import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { User } from 'app/interfaces/user.interface';
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
