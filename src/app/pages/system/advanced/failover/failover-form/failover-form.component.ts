import { ChangeDetectionStrategy, Component, DestroyRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import { filter, switchMap } from 'rxjs/operators';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { haSettingsUpdated } from 'app/store/ha-info/ha-info.actions';

@Component({
  selector: 'ix-failover-form',
  templateUrl: './failover-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnInputComponent,
    FormActionsComponent,
    TnButtonComponent,
  ],
})
export class FailoverFormComponent extends SidePanelForm {
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
  protected readonly InputType = InputType;

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  constructor() {
    super();

    this.api.call('failover.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
      this.form.patchValue({
        enabled: !config.disabled,
        timeout: config.timeout,
      });
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

          this.close(true);
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
