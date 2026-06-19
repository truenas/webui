import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import {
  EMPTY, catchError, filter, of, switchMap, take, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalTwoFactorConfig, GlobalTwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-global-two-factor-auth-form',
  templateUrl: './global-two-factor-form.component.html',
  styleUrls: ['./global-two-factor-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class GlobalTwoFactorAuthFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemSecurityWrite];
  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);
  form = this.fb.nonNullable.group({
    enabled: [false],
    window: [null as number | null, Validators.required],
    ssh: [false],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  enableWarning: string = this.translate.instant('Once enabled, users will be prompted to set up two-factor authentication next time they login. They can choose to skip the setup if desired.');

  protected twoFactorConfig: GlobalTwoFactorConfig;

  ngOnInit(): void {
    this.api.call('auth.twofactor.config').pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.twoFactorConfig = config;
      this.form.patchValue({
        enabled: config.enabled,
        window: config.window,
        ssh: config.services.ssh,
      });
    });
  }

  protected onSubmit(): void {
    let shouldWarn = true;
    if (!this.twoFactorConfig.enabled || !this.form.value.enabled) {
      shouldWarn = false;
    }

    const values = this.form.getRawValue();
    const payload: GlobalTwoFactorConfigUpdate = {
      enabled: values.enabled,
      services: { ssh: values.ssh },
      window: Number(values.window),
    };
    const confirmation$ = shouldWarn
      ? this.dialogService.confirm({
          title: this.translate.instant('Warning!'),
          message: this.translate.instant('Changing global 2FA settings might cause user secrets to reset. Which means users will have to reconfigure their 2FA. Are you sure you want to continue?'),
        })
      : of(true);
    confirmation$.pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading.set(true);
        return this.api.call('auth.twofactor.update', [payload]);
      }),
      tap(() => {
        this.window.localStorage.setItem('showQr2FaWarning', `${this.form.value.enabled}`);
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.authService.globalTwoFactorConfigUpdated();
        if (!isEqual(this.twoFactorConfig, payload) && payload.enabled) {
          this.router.navigate(['/two-factor-auth']);
        }
        this.close(true);
      }),
      catchError((error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}
