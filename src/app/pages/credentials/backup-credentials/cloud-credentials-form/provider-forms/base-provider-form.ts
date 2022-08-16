import { FormGroup } from '@angular/forms';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';

export abstract class BaseProviderFormComponent<T = CloudCredential['attributes']> {
  abstract readonly form: FormGroup;
  provider: CloudsyncProvider;

  readonly helptext = helptext;

  /**
   * Override in child class to do async data preparation.
   *
   * TODO: Only exists to allow for 'Generate New' private key option in SFTP form.
   * TODO: Consider making this functionality part of the private key select.
   */
  beforeSubmit(): Observable<unknown> {
    return of(undefined);
  }

  getSubmitAttributes(): T {
    const nonNullAttributes = _.omitBy(this.form.value, _.isNull);
    return nonNullAttributes as T;
  }

  setValues(values: T): void {
    this.form.patchValue(values);
  }
}
