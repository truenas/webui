import { ChangeDetectionStrategy, Component, input, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnChipInputComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosRealms } from 'app/helptext/directory-service/kerberos-realms-form-list';
import { KerberosRealm, KerberosRealmUpdate } from 'app/interfaces/kerberos-realm.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-kerberos-realms-form',
  templateUrl: './kerberos-realms-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnChipInputComponent,
    TranslateModule,
  ],
})
export class KerberosRealmsFormComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  /** Realm being edited; absent when adding. Supplied by the `<tn-side-panel>` host. */
  readonly editingRow = input<KerberosRealm | undefined>(undefined);

  readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected editingRealm: KerberosRealm | undefined;

  protected readonly form = this.fb.group({
    realm: ['', Validators.required],
    kdc: [[] as string[]],
    primary_kdc: [null as string],
    admin_server: [[] as string[]],
    kpasswd_server: [[] as string[]],
  });

  readonly tooltips = {
    realm: helptextKerberosRealms.realmTooltip,
    kdc: `${helptextKerberosRealms.kdcTooltip} ${helptextKerberosRealms.multipleValues}`,
    admin_server: `${helptextKerberosRealms.adminServersTooltip} ${helptextKerberosRealms.multipleValues}`,
    kpasswd_server: `${helptextKerberosRealms.passwordServersTooltip} ${helptextKerberosRealms.multipleValues}`,
    primary_kdc: helptextKerberosRealms.primaryKdcTooltip,
  };

  ngOnInit(): void {
    // The inner `<ix-form>` patches the record through `[editData]`; kept here for the submit path.
    this.editingRealm = this.editingRow();
  }

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    const values = this.form.value as KerberosRealmUpdate;
    const editingRealm = this.editingRealm;

    return {
      request$: editingRealm
        ? this.api.call('kerberos.realm.update', [editingRealm.id, values])
        : this.api.call('kerberos.realm.create', [values]),
      successMessage: event.isEdit
        ? this.translate.instant('Kerberos realm updated.')
        : this.translate.instant('Kerberos realm created.'),
    };
  };
}
