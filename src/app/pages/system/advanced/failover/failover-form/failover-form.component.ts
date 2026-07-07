import { ChangeDetectionStrategy, Component, DestroyRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { haSettingsUpdated } from 'app/store/ha-info/ha-info.actions';

@Component({
  selector: 'ix-failover-form',
  templateUrl: './failover-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFieldsetComponent,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
  ],
})
export class FailoverFormComponent {
  slideInRef = inject<SlideInRef<FailoverConfig, boolean>>(SlideInRef);
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);

  protected form = this.formBuilder.group({
    enabled: [false],
    timeout: [null as number | null],
  });

  protected isLoading = signal(false);
  protected readonly helptext = helptextSystemFailover;

  constructor() {
    const config = this.slideInRef.getData();

    this.form.patchValue({
      enabled: !config.disabled,
      timeout: config.timeout,
    });

    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    const values = this.form.getRawValue();
    const payload = {
      master: true,
      timeout: values.timeout,
      disabled: !values.enabled,
    };

    this.api.call('failover.update', [payload]).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.store$.dispatch(haSettingsUpdated());
          this.snackbar.success(this.translate.instant('Settings saved.'));
          this.isLoading.set(false);

          this.slideInRef.close({
            response: true,
          });
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.isLoading.set(false);
        },
      });
  }

  protected onSyncToPeerPressed(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextSystemFailover.syncToPeerTitle),
      message: this.translate.instant(helptextSystemFailover.syncToPeerMessage),
      buttonText: this.translate.instant(helptextSystemFailover.proceedButton),
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant(helptextSystemFailover.syncToPeerRestartStandbyCheckbox),
    })
      .pipe(
        filter((result) => result.confirmed),
        switchMap((result) => {
          this.isLoading.set(true);
          return this.api.call('failover.sync_to_peer', [{ reboot: result.secondaryCheckbox }]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackbar.success(
            this.translate.instant(helptextSystemFailover.confirmDialogs.syncToMessage),
          );
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  protected onSyncFromPeerPressed(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextSystemFailover.syncFromPeerTitle),
      message: this.translate.instant(helptextSystemFailover.syncFromPeerMessage),
      buttonText: this.translate.instant(helptextSystemFailover.proceedButton),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.isLoading.set(true);
          return this.api.call('failover.sync_from_peer');
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackbar.success(
            this.translate.instant(helptextSystemFailover.confirmDialogs.syncFromMessage),
          );
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
