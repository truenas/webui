import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy({
  arrayName: 'subscriptions',
})
@Component({
  templateUrl: './failover-settings.component.html',
  styleUrls: ['./failover-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailoverSettingsComponent implements OnInit {
  isLoading = false;
  form = this.formBuilder.group({
    disabled: [false],
    master: [true],
    timeout: [null as number],
  });

  subscriptions: Subscription[] = [];

  submitButtonText$ = this.form.select((values) => {
    if (!values.master) {
      return this.translate.instant('Save And Failover');
    }
    return this.translate.instant('Save');
  });

  readonly helptext = helptextSystemFailover;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadFormValues();
  }

  onSubmit(): void {
    this.isLoading = true;
    const values = this.form.getRawValue();

    this.ws.call('failover.update', [values])
      .pipe(
        switchMap(() => {
          return this.dialogService.info(
            this.translate.instant('Failover'),
            this.translate.instant('Settings saved.'),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();

          if (values.disabled && !values.master) {
            this.ws.logout();
          }
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSyncToPeerPressed(): void {
    const dialog = this.dialogService.confirm({
      title: helptextSystemFailover.dialog_sync_to_peer_title,
      message: helptextSystemFailover.dialog_sync_to_peer_message,
      buttonMsg: helptextSystemFailover.dialog_button_ok,
      secondaryCheckBox: true,
      secondaryCheckBoxMsg: helptextSystemFailover.dialog_sync_to_peer_checkbox,
      data: [{ reboot: false }],
    });

    dialog
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.isLoading = true;
          this.cdr.markForCheck();
          return this.ws.call('failover.sync_to_peer', dialog.componentInstance.data as [{ reboot?: boolean }]);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackbar.success(
            helptextSystemFailover.confirm_dialogs.sync_to_message,
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }

  onSyncFromPeerPressed(): void {
    this.dialogService.confirm({
      title: helptextSystemFailover.dialog_sync_from_peer_title,
      message: helptextSystemFailover.dialog_sync_from_peer_message,
      buttonMsg: helptextSystemFailover.dialog_button_ok,
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.isLoading = true;
          this.cdr.markForCheck();
          return this.ws.call('failover.sync_from_peer');
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.snackbar.success(
            this.translate.instant(helptextSystemFailover.confirm_dialogs.sync_from_message),
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }

  private loadFormValues(): void {
    this.isLoading = true;

    this.ws.call('failover.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.form.patchValue({
            ...config,
            master: true,
          });
          this.setFailoverConfirmation();
          this.setFormRelations();
        },
        error: (error) => {
          this.isLoading = false;
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.cdr.markForCheck();
        },
      });
  }

  private setFailoverConfirmation(): void {
    this.form.controls.master.valueChanges
      .pipe(
        filter((isMaster) => !isMaster),
        switchMap(() => {
          return this.dialogService.confirm({
            title: helptextSystemFailover.master_dialog_title,
            message: helptextSystemFailover.master_dialog_warning,
            buttonMsg: this.translate.instant('Continue'),
            cancelMsg: this.translate.instant('Cancel'),
            disableClose: true,
          });
        }),
        take(1),
        filter((wasConfirmed) => !wasConfirmed),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.form.patchValue({ master: true });
      });
  }

  private setFormRelations(): void {
    this.subscriptions.push(
      this.form.controls.master.disabledWhile(
        this.form.select((values) => !values.disabled),
      ),
    );
  }
}
