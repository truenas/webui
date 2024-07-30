import { FormGroup } from '@angular/forms';
import _ from 'lodash';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';

export abstract class BaseProviderFormComponent<T = CloudCredential['attributes']> {
  provider: CloudSyncProvider;
  abstract readonly form: FormGroup;
  protected formPatcher$ = new BehaviorSubject<CloudCredential['attributes']>({});

  readonly helptext = helptext;

  /**
   * Override in child class to do async data preparation.
   *
   * TODO: Only exists to allow for 'Generate New' private key option in SFTP form.
   * TODO: Consider making this functionality part of the private key select.
   */
  beforeSubmit(): Observable<unknown> {
    return of([]);
  }

  getSubmitAttributes(): T {
    const nonNullAttributes = _.omitBy(this.form.value, _.isNull);
    return nonNullAttributes as T;
  }

  getFormSetter$ = (): BehaviorSubject<CloudCredential['attributes']> => {
    return this.formPatcher$;
  };
}
