import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
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
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { haSettingsUpdated } from 'app/store/ha-info/ha-info.actions';

@Component({
  selector: 'ix-failover-form',
  templateUrl: './failover-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnInputComponent,
    FormActionsComponent,
    TnButtonComponent,
  ],
})
export class FailoverFormComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);

  protected form = this.formBuilder.group({
    enabled: [false],
    timeout: [null as number | null],
  });

  /**
   * A peer sync kicked off by the in-body actions — neither a config load nor a submit, so it is
   * tracked here and folded into the host's busy/Save gating by the overrides below.
   */
  protected readonly isSyncing = signal(false);

  protected readonly helptext = helptextSystemFailover;
  protected readonly InputType = InputType;

  /** Surfaces the peer sync in the panel's progress bar alongside the load/submit the base tracks. */
  override isBusy(): boolean {
    return super.isBusy() || this.isSyncing();
  }

  /** A sync and a save both talk to the peer; don't let the footer Save start one mid-sync. */
  override canSubmit(): boolean {
    return !this.isSyncing() && super.canSubmit();
  }

  ngOnInit(): void {
    this.loadFormConfig(this.api.call('failover.config'), (config) => {
      this.form.patchValue({
        enabled: !config.disabled,
        timeout: config.timeout,
      });
    });
  }

  protected handleSubmit = (): SubmitResult => {
    const values = this.form.getRawValue();

    return {
      request$: this.api.call('failover.update', [{
        master: true,
        timeout: values.timeout,
        disabled: !values.enabled,
      }]),
      successMessage: this.translate.instant('Settings saved.'),
      onSuccess: () => this.store$.dispatch(haSettingsUpdated()),
    };
  };

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
          this.isSyncing.set(true);
          return this.api.call('failover.sync_to_peer', [{ reboot: result.secondaryCheckbox }]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSyncing.set(false);
          this.snackbar.success(
            this.translate.instant(helptextSystemFailover.confirmDialogs.syncToMessage),
          );
        },
        error: (error: unknown) => {
          this.isSyncing.set(false);
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
          this.isSyncing.set(true);
          return this.api.call('failover.sync_from_peer');
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSyncing.set(false);
          this.snackbar.success(
            this.translate.instant(helptextSystemFailover.confirmDialogs.syncFromMessage),
          );
        },
        error: (error: unknown) => {
          this.isSyncing.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
