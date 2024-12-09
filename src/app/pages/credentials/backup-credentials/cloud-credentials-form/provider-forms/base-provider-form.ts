import { FormGroup } from '@angular/forms';
import { isNull, omitBy } from 'lodash-es';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { SomeProviderAttributes } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';

export abstract class BaseProviderFormComponent<T = SomeProviderAttributes> {
  provider: CloudSyncProvider;
  abstract readonly form: FormGroup;
  protected formPatcher$ = new BehaviorSubject<SomeProviderAttributes>({});

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
    const nonNullAttributes = omitBy(this.form.value, isNull);
    return nonNullAttributes as T;
  }

  getFormSetter$ = (): BehaviorSubject<SomeProviderAttributes> => {
    return this.formPatcher$;
  };
}
