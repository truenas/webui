import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { failoverElements } from 'app/pages/system/failover-settings/failover-settings.elements';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { haSettingsUpdated } from 'app/store/ha-info/ha-info.actions';

@UntilDestroy({
  arrayName: 'subscriptions',
})
@Component({
  selector: 'ix-failover-settings',
  templateUrl: './failover-settings.component.html',
  styleUrls: ['./failover-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatCardContent,
    MatProgressBar,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxInputComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class FailoverSettingsComponent implements OnInit {
  protected readonly searchableElements = failoverElements;

  isLoading = false;
  form = this.formBuilder.group({
    disabled: [false],
    master: [true],
    timeout: [null as number],
  });

  subscriptions: Subscription[] = [];

  protected readonly requiredRoles = [Role.FailoverWrite];

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
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    private wsManager: WebSocketConnectionService,
  ) {}

  ngOnInit(): void {
    this.loadFormValues();
  }

  onSubmit(): void {
    this.isLoading = true;
    const values = this.form.getRawValue();

    this.ws.call('failover.update', [values])
      .pipe(
        map(() => { this.store$.dispatch(haSettingsUpdated()); }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Settings saved.'));
          this.isLoading = false;
          this.cdr.markForCheck();

          if (values.disabled && !values.master) {
            this.authService.logout().pipe(untilDestroyed(this)).subscribe({
              next: () => {
                this.authService.clearAuthToken();
                this.wsManager.closeWebSocketConnection();
              },
            });
          }
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSyncToPeerPressed(): void {
    this.dialogService.confirm({
      title: helptextSystemFailover.dialog_sync_to_peer_title,
      message: helptextSystemFailover.dialog_sync_to_peer_message,
      buttonText: helptextSystemFailover.dialog_button_ok,
      secondaryCheckbox: true,
      secondaryCheckboxText: helptextSystemFailover.dialog_sync_to_peer_checkbox,
    })
      .pipe(
        filter((result) => result.confirmed),
        switchMap((result) => {
          this.isLoading = true;
          this.cdr.markForCheck();
          return this.ws.call('failover.sync_to_peer', [{ reboot: result.secondaryCheckbox }]);
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
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  onSyncFromPeerPressed(): void {
    this.dialogService.confirm({
      title: helptextSystemFailover.dialog_sync_from_peer_title,
      message: helptextSystemFailover.dialog_sync_from_peer_message,
      buttonText: helptextSystemFailover.dialog_button_ok,
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
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseError(error));
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
        error: (error: unknown) => {
          this.isLoading = false;
          this.dialogService.error(this.errorHandler.parseError(error));
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
    this.subscriptions.push(
      this.form.controls.master.disabledWhile(
        this.form.select((values) => !values.disabled),
      ),
    );
  }
}
