import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
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
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated, generalConfigUpdated, loginBannerUpdated } from 'app/store/system-config/system-config.actions';
import {
  waitForAdvancedConfig,
  waitForGeneralConfig,
} from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

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
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AuthSessionsWrite];

  protected isLoading = signal(false);
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  form = this.fb.nonNullable.group({
    ds_auth: [false],
    login_banner: [null as string | null],
  });

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.store$.pipe(waitForGeneralConfig, takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
      this.form.controls.ds_auth.setValue(config.ds_auth);
    });

    this.store$.pipe(waitForAdvancedConfig, takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
      this.form.controls.login_banner.setValue(config.login_banner);
    });
  }

  protected onSubmit(): void {
    this.authService.hasRole(this.requiredRoles)
      .pipe(
        filter(Boolean),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
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
            .pipe(takeUntilDestroyed(this.destroyRef))
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
