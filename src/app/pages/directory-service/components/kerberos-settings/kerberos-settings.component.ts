import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosSettings } from 'app/helptext/directory-service/kerberos-settings';
import { KerberosConfigUpdate } from 'app/interfaces/kerberos-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-kerberos-settings',
  templateUrl: './kerberos-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxTextareaComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class KerberosSettingsComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];

  protected isFormLoading = signal(false);

  form = this.fb.group({
    appdefaults_aux: [''],
    libdefaults_aux: [''],
  });

  readonly tooltips = {
    appdefaults_aux: helptextKerberosSettings.ks_appdefaults_tooltip,
    libdefaults_aux: helptextKerberosSettings.ks_libdefaults_tooltip,
  };

  constructor(
    private api: ApiService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    public slideInRef: SlideInRef<KerberosSettingsComponent | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.isFormLoading.set(true);

    this.api.call('kerberos.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.isFormLoading.set(false);
      },
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading.set(true);
    this.api.call('kerberos.update', [values as KerberosConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
