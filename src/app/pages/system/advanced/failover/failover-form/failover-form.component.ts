import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { startWith } from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { AuthService } from 'app/modules/auth/auth.service';
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
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { haSettingsUpdated } from 'app/store/ha-info/ha-info.actions';

@UntilDestroy()
@Component({
  selector: 'ix-failover-form',
  templateUrl: './failover-form.component.html',
  styleUrls: ['./failover-form.component.scss'],
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
    AsyncPipe,
    MatButton,
    TestDirective,
  ],
})
export class FailoverFormComponent {
  protected form = this.formBuilder.group({
    enabled: [false],
    master: [true],
    timeout: [null as number | null],
  });

  protected isLoading = signal(false);
  protected readonly helptext = helptextSystemFailover;

  submitButtonText$ = this.form.controls.master.valueChanges.pipe(
    startWith(true),
    map((isMaster) => {
      return isMaster
        ? this.translate.instant('Save')
        : this.translate.instant('Save And Failover');
    }),
  );

  constructor(
    public slideInRef: SlideInRef<FailoverConfig, boolean>,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private store$: Store,
    private authService: AuthService,
    private wsHandler: WebSocketHandlerService,
    private router: Router,
  ) {
    const config = this.slideInRef.getData();

    this.form.patchValue({
      enabled: !config.disabled,
      master: config.master,
      timeout: config.timeout,
    });

    this.setFormRelations();
    this.warnOnMasterChange();
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    const values = this.form.getRawValue();
    const payload = {
      master: values.master,
      timeout: values.timeout,
      disabled: !values.enabled,
    };

    this.api.call('failover.update', [payload]).pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.store$.dispatch(haSettingsUpdated());
          this.snackbar.success(this.translate.instant('Settings saved.'));
          this.isLoading.set(false);

          const shouldReLogin = payload.disabled && !values.master;
          if (shouldReLogin) {
            this.redirectToLoginPage();
            return;
          }

          this.slideInRef.close({
            response: true,
            error: null,
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
        untilDestroyed(this),
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
        untilDestroyed(this),
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

  private warnOnMasterChange(): void {
    this.form.controls.master.valueChanges
      .pipe(
        filter((isMaster) => !isMaster),
        switchMap(() => {
          return this.dialogService.confirm({
            title: this.translate.instant(helptextSystemFailover.masterDialogTitle),
            message: this.translate.instant(helptextSystemFailover.masterDialogWarning),
            buttonText: this.translate.instant('Continue'),
            cancelText: this.translate.instant('Cancel'),
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
    this.form.controls.enabled.valueChanges
      .pipe(
        startWith(this.form.value.enabled),
        untilDestroyed(this),
      )
      .subscribe((enabled) => {
        if (enabled) {
          this.form.controls.master.disable({ emitEvent: false });
        } else {
          this.form.controls.master.enable({ emitEvent: false });
        }
      });
  }

  private redirectToLoginPage(): void {
    this.authService.logout().pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.wsHandler.reconnect();
        this.router.navigate(['/signin']);
      },
    });
  }
}
