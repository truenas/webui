import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/directory-service/kerberos-realms-form-list';
import { KerberosRealm, KerberosRealmUpdate } from 'app/interfaces/kerberos-realm.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './kerberos-realms-form.component.html',
  styleUrls: ['./kerberos-realms-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KerberosRealmsFormComponent {
  private editingRealm: KerberosRealm;
  get isNew(): boolean {
    return !this.editingRealm;
  }

  isFormLoading = false;

  form = this.fb.group({
    realm: ['', Validators.required],
    kdc: [[] as string[]],
    admin_server: [[] as string[]],
    kpasswd_server: [[] as string[]],
  });

  readonly tooltips = {
    realm: helptext.krbrealm_form_realm_tooltip,
    kdc: `${helptext.krbrealm_form_kdc_tooltip} ${helptext.multiple_values}`,
    admin_server: `${helptext.krbrealm_form_admin_server_tooltip} ${helptext.multiple_values}`,
    kpasswd_server: `${helptext.krbrealm_form_kpasswd_server_tooltip} ${helptext.multiple_values}`,
  };

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Kerberos Realm')
      : this.translate.instant('Edit Kerberos Realm');
  }

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
  ) {}

  setRealmForEdit(realm: KerberosRealm): void {
    this.editingRealm = realm;
    if (!this.isNew) {
      this.form.patchValue(this.editingRealm);
    }
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('kerberos.realm.create', [values as KerberosRealmUpdate]);
    } else {
      request$ = this.ws.call('kerberos.realm.update', [
        this.editingRealm.id,
        values as KerberosRealmUpdate,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
