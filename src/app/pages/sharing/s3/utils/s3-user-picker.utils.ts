import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { User } from 'app/interfaces/user.interface';
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
