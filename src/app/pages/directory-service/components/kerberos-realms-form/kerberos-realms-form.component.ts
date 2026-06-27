import { ChangeDetectionStrategy, Component, DestroyRef, input, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnChipInputComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosRealms } from 'app/helptext/directory-service/kerberos-realms-form-list';
import { KerberosRealm, KerberosRealmUpdate } from 'app/interfaces/kerberos-realm.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-kerberos-realms-form',
  templateUrl: './kerberos-realms-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnChipInputComponent,
    TranslateModule,
  ],
})
export class KerberosRealmsFormComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  /** Realm being edited; absent when adding. Supplied by the `<tn-side-panel>` host. */
  readonly editingRow = input<KerberosRealm | undefined>(undefined);

  readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected editingRealm: KerberosRealm | undefined;

  protected readonly isFormLoading = signal(false);

  protected readonly form = this.fb.group({
    realm: ['', Validators.required],
    kdc: [[] as string[]],
    primary_kdc: [null as string],
    admin_server: [[] as string[]],
    kpasswd_server: [[] as string[]],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly tooltips = {
    realm: helptextKerberosRealms.realmTooltip,
    kdc: `${helptextKerberosRealms.kdcTooltip} ${helptextKerberosRealms.multipleValues}`,
    admin_server: `${helptextKerberosRealms.adminServersTooltip} ${helptextKerberosRealms.multipleValues}`,
    kpasswd_server: `${helptextKerberosRealms.passwordServersTooltip} ${helptextKerberosRealms.multipleValues}`,
    primary_kdc: helptextKerberosRealms.primaryKdcTooltip,
  };

  ngOnInit(): void {
    this.editingRealm = (this.slideInRef?.getData() as KerberosRealm | undefined) ?? this.editingRow();

    if (this.editingRealm) {
      this.form.patchValue(this.editingRealm);
    }
  }

  protected onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading.set(true);
    let request$: Observable<unknown>;
    if (this.editingRealm) {
      request$ = this.api.call('kerberos.realm.update', [
        this.editingRealm.id,
        values as KerberosRealmUpdate,
      ]);
    } else {
      request$ = this.api.call('kerberos.realm.create', [values as KerberosRealmUpdate]);
    }

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
