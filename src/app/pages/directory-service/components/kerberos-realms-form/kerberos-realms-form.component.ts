import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosRealms } from 'app/helptext/directory-service/kerberos-realms-form-list';
import { KerberosRealm, KerberosRealmUpdate } from 'app/interfaces/kerberos-realm.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-kerberos-realms-form',
  templateUrl: './kerberos-realms-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxChipsComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class KerberosRealmsFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected editingRealm: KerberosRealm | undefined;

  get isNew(): boolean {
    return !this.editingRealm;
  }

  protected isFormLoading = signal(false);

  form = this.fb.group({
    realm: ['', Validators.required],
    kdc: [[] as string[]],
    admin_server: [[] as string[]],
    kpasswd_server: [[] as string[]],
  });

  readonly tooltips = {
    realm: helptextKerberosRealms.realmTooltip,
    kdc: `${helptextKerberosRealms.kdcTooltip} ${helptextKerberosRealms.multipleValues}`,
    admin_server: `${helptextKerberosRealms.adminServersTooltip} ${helptextKerberosRealms.multipleValues}`,
    kpasswd_server: `${helptextKerberosRealms.passwordServersTooltip} ${helptextKerberosRealms.multipleValues}`,
  };

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Kerberos Realm')
      : this.translate.instant('Edit Kerberos Realm');
  }

  constructor(
    private api: ApiService,
    private errorHandler: FormErrorHandlerService,
    private fb: FormBuilder,
    private translate: TranslateService,
    public slideInRef: SlideInRef<KerberosRealm | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingRealm = slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingRealm) {
      this.form.patchValue(this.editingRealm);
    }
  }

  onSubmit(): void {
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

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
