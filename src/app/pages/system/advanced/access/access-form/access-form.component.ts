import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, finalize, forkJoin, Observable, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { lifetimeTokenUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { advancedConfigUpdated, generalConfigUpdated, loginBannerUpdated } from 'app/store/system-config/system-config.actions';
import { selectAdvancedConfig, selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-access-form',
  templateUrl: 'access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxTextareaComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class AccessFormComponent implements OnInit {
  readonly requiredRoles = [Role.AuthSessionsWrite];

  isLoading = false;
  form = this.fb.group({
    token_lifetime: [defaultPreferences.lifetime, [
      Validators.required,
      Validators.min(30), // Min value allowed is 30 seconds.
      Validators.max(2147482), // Max value is 2147482 seconds, or 24 days, 20 hours, 31 minutes, and 22 seconds.
    ]],
    ds_auth: [false],
    login_banner: [null as string],
  });

  get isEnterprise(): boolean {
    return this.systemGeneralService.isEnterprise;
  }

  constructor(
    private fb: FormBuilder,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private authService: AuthService,
    private chainedSlideInRef: ChainedRef<unknown>,
  ) {}

  ngOnInit(): void {
    this.store$.select(selectPreferences).pipe(untilDestroyed(this)).subscribe((preferences) => {
      if (preferences.lifetime) {
        this.form.controls.token_lifetime.setValue(preferences.lifetime);
        this.cdr.markForCheck();
      }
    });

    this.store$.select(selectGeneralConfig).pipe(untilDestroyed(this)).subscribe((config) => {
      this.form.controls.ds_auth.setValue(config.ds_auth);
      this.cdr.markForCheck();
    });

    this.store$.select(selectAdvancedConfig).pipe(untilDestroyed(this)).subscribe((config) => {
      this.form.controls.login_banner.setValue(config.login_banner);
      this.cdr.markForCheck();
    });
  }

  onSubmit(): void {
    this.authService.hasRole(this.requiredRoles)
      .pipe(
        filter(Boolean),
        take(1),
        untilDestroyed(this),
      ).subscribe(() => {
        this.store$.dispatch(lifetimeTokenUpdated({ lifetime: this.form.value.token_lifetime }));

        const bannerChanged = this.form.controls.login_banner.dirty;

        if (bannerChanged || this.isEnterprise) {
          const requests$ = [];
          this.isLoading = true;

          if (bannerChanged) {
            requests$.push(this.updateLoginBanner());
          }

          if (this.isEnterprise) {
            requests$.push(this.updateEnterpriseDsAuth());
          }

          forkJoin(requests$)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: () => {
                this.isLoading = false;
                this.showSuccessNotificationAndClose();
                this.cdr.markForCheck();
              },
              error: (error) => {
                this.isLoading = false;
                this.dialogService.error(this.errorHandler.parseError(error));
                this.cdr.markForCheck();
              },
            });
        } else {
          this.showSuccessNotificationAndClose();
        }
      });
  }

  private updateLoginBanner(): Observable<unknown> {
    const loginBanner = this.form.value.login_banner;
    return this.ws.call('system.advanced.update', [{ login_banner: loginBanner }])
      .pipe(finalize(() => {
        this.store$.dispatch(advancedConfigUpdated());
        this.store$.dispatch(loginBannerUpdated({ loginBanner }));
      }));
  }

  private updateEnterpriseDsAuth(): Observable<unknown> {
    return this.ws.call('system.general.update', [{ ds_auth: this.form.value.ds_auth }])
      .pipe(finalize(() => this.store$.dispatch(generalConfigUpdated())));
  }

  private showSuccessNotificationAndClose(): void {
    this.snackbar.success(this.translate.instant('Settings saved'));
    this.chainedSlideInRef.close({ response: true, error: null });
  }
}
