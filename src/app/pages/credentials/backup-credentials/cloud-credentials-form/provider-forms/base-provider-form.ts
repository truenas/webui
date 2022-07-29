import { FormGroup, UntypedFormGroup } from '@angular/forms';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import _ from 'lodash';

export class BaseProviderFormComponent<T = CloudCredential['attributes']> {
  readonly form: FormGroup;
  provider: CloudsyncProvider;

  readonly helptext = helptext;

  getSubmitAttributes(): T {
    const nonNullAttributes = _.omitBy(this.form.value, _.isNull);
    return nonNullAttributes as T;
  }

  setValues(values: T): void {
    this.form.patchValue(values);
  }
}
