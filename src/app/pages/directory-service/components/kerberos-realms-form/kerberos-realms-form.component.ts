import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
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
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-kerberos-realms-form',
  templateUrl: './kerberos-realms-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
    realm: helptextKerberosRealms.krbrealm_form_realm_tooltip,
    kdc: `${helptextKerberosRealms.krbrealm_form_kdc_tooltip} ${helptextKerberosRealms.multiple_values}`,
    admin_server: `${helptextKerberosRealms.krbrealm_form_admin_server_tooltip} ${helptextKerberosRealms.multiple_values}`,
    kpasswd_server: `${helptextKerberosRealms.krbrealm_form_kpasswd_server_tooltip} ${helptextKerberosRealms.multiple_values}`,
  };

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Kerberos Realm')
      : this.translate.instant('Edit Kerberos Realm');
  }

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private slideInRef: SlideInRef<KerberosRealmsFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingRealm: KerberosRealm,
  ) {}

  ngOnInit(): void {
    if (this.editingRealm) {
      this.setRealmForEdit();
    }
  }

  setRealmForEdit(): void {
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
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
