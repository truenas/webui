import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, finalize, forkJoin, Observable, of, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { lifetimeTokenUpdated } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { advancedConfigUpdated, generalConfigUpdated, loginBannerUpdated } from 'app/store/system-config/system-config.actions';
import {
  waitForAdvancedConfig,
  waitForGeneralConfig,
} from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-access-form',
  templateUrl: 'access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
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
  private fb = inject(FormBuilder);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.AuthSessionsWrite];

  protected isLoading = signal(false);
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  form = this.fb.nonNullable.group({
    token_lifetime: [defaultPreferences.lifetime, [
      Validators.required,
      Validators.min(30), // Min value allowed is 30 seconds.
      Validators.max(2147482), // Max value is 2147482 seconds, or 24 days, 20 hours, 31 minutes, and 22 seconds.
    ]],
    ds_auth: [false],
    login_banner: [null as string | null],
  });

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.store$.pipe(waitForPreferences, untilDestroyed(this)).subscribe((preferences) => {
      if (preferences.lifetime) {
        this.form.controls.token_lifetime.setValue(preferences.lifetime);
      }
    });

    this.store$.pipe(waitForGeneralConfig, untilDestroyed(this)).subscribe((config) => {
      this.form.controls.ds_auth.setValue(config.ds_auth);
    });

    this.store$.pipe(waitForAdvancedConfig, untilDestroyed(this)).subscribe((config) => {
      this.form.controls.login_banner.setValue(config.login_banner);
    });
  }

  protected onSubmit(): void {
    this.authService.hasRole(this.requiredRoles)
      .pipe(
        filter(Boolean),
        take(1),
        untilDestroyed(this),
      ).subscribe(() => {
        this.store$.dispatch(lifetimeTokenUpdated({ lifetime: this.form.getRawValue().token_lifetime }));

        const bannerChanged = this.form.controls.login_banner.dirty;

        if (bannerChanged || this.isEnterprise) {
          const requests$ = [];
          this.isLoading.set(true);

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
                this.isLoading.set(false);
                this.showSuccessNotificationAndClose();
              },
              error: (error: unknown) => {
                this.isLoading.set(false);
                this.errorHandler.showErrorModal(error);
              },
            });
        } else {
          this.showSuccessNotificationAndClose();
        }
      });
  }

  private updateLoginBanner(): Observable<unknown> {
    const loginBanner = this.form.value.login_banner || '';
    return this.api.call('system.advanced.update', [{ login_banner: loginBanner }])
      .pipe(finalize(() => {
        this.store$.dispatch(advancedConfigUpdated());
        this.store$.dispatch(loginBannerUpdated({ loginBanner }));
      }));
  }

  private updateEnterpriseDsAuth(): Observable<unknown> {
    return this.api.call('system.general.update', [{ ds_auth: this.form.value.ds_auth }])
      .pipe(finalize(() => this.store$.dispatch(generalConfigUpdated())));
  }

  private showSuccessNotificationAndClose(): void {
    this.snackbar.success(this.translate.instant('Settings saved'));
    this.slideInRef.close({ response: true });
  }
}
