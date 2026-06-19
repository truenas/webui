import { Component, ChangeDetectionStrategy, DestroyRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@Component({
  selector: 'ix-self-encrypting-drive-form',
  templateUrl: './self-encrypting-drive-form.component.html',
  styleUrls: ['./self-encrypting-drive-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class SelfEncryptingDriveFormComponent extends SidePanelForm {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];
  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);
  title = helptextSystemAdvanced.sedTitle;
  form = this.fb.group({
    sed_passwd: [''],
    sed_passwd2: [''],
  }, {
    validators: [
      matchOthersFgValidator(
        'sed_passwd2',
        ['sed_passwd'],
        this.translate.instant('SED password and confirmation should match.'),
      ),
    ],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly labels = {
    sed_passwd: helptextSystemAdvanced.sedPasswordLabel,
    sed_passwd2: helptextSystemAdvanced.sedConfirmPasswordLabel,
  };

  readonly tooltips = {
    sed_passwd: helptextSystemAdvanced.sedPasswordTooltip,
  };

  protected onSubmit(): void {
    this.isFormLoading.set(true);

    const values = this.form.value;
    delete values.sed_passwd2;

    this.api.call('system.advanced.update', [values]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
