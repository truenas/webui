import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { startWith } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { TrueCommandConfig, UpdateTrueCommand } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface TruecommandSignupModalState {
  isConnected: boolean;
  config: TrueCommandConfig;
}

export type TruecommandSignupModalResult = boolean | { deregistered: boolean };

@Component({
  selector: 'ix-truecommand-connect-modal',
  styleUrls: ['./truecommand-connect-modal.component.scss'],
  templateUrl: './truecommand-connect-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxInputComponent,
    IxCheckboxComponent,
    TnButtonComponent,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class TruecommandConnectModalComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private data = inject<TruecommandSignupModalState>(DIALOG_DATA);
  private dialogService = inject(DialogService);
  private dialogRef = inject<
    DialogRef<TruecommandSignupModalResult, TruecommandConnectModalComponent>
  >(DialogRef);

  private fb = inject(FormBuilder);
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  readonly helptext = helptextTopbar;
  protected readonly requiredRoles = [Role.TrueCommandWrite];

  title: string;
  saveButtonText: string;

  form = this.fb.nonNullable.group({
    api_key: [''],
    enabled: [true],
  });

  get isConnected(): boolean { return this.data?.isConnected; }

  ngOnInit(): void {
    this.title = this.data.isConnected
      ? helptextTopbar.updateDialog.titleUpdate
      : helptextTopbar.updateDialog.titleConnect;
    this.saveButtonText = this.data.isConnected
      ? helptextTopbar.updateDialog.saveButton
      : helptextTopbar.updateDialog.connectButton;

    if (this.data.isConnected) {
      this.form.patchValue({
        ...this.data.config,
        api_key: this.data.config.api_key || '',
      });
      this.cdr.markForCheck();
    }

    // The backend rejects an empty API key while the service is enabled, so require it here.
    this.form.controls.enabled.valueChanges.pipe(
      startWith(this.form.controls.enabled.value),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((enabled) => {
      const apiKey = this.form.controls.api_key;
      apiKey.setValidators(enabled ? [Validators.required] : []);
      apiKey.updateValueAndValidity();
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    // The submit button is disabled when the form is invalid, but Enter can still
    // trigger (ngSubmit), so guard here as well.
    if (this.form.invalid) {
      return;
    }

    this.loader.open();

    const params = {} as UpdateTrueCommand;

    params.enabled = this.form.getRawValue().enabled;
    if (this.form.value.api_key) {
      params.api_key = this.form.getRawValue().api_key;
    }

    this.api.call('truecommand.update', [params]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loader.close();
        this.dialogRef.close();

        if (!this.isConnected) {
          this.dialogService.info(
            helptextTopbar.checkEmailInfoDialog.title,
            helptextTopbar.checkEmailInfoDialog.message,
          );
        }
      },
      error: (error: unknown) => {
        this.loader.close();
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  onDeregister(): void {
    this.dialogService.generalDialog({
      title: helptextTopbar.tcDeregisterDialog.title,
      icon: helptextTopbar.tcDeregisterDialog.icon,
      message: helptextTopbar.tcDeregisterDialog.message,
      confirmBtnMsg: helptextTopbar.tcDeregisterDialog.confirmBtnMsg,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.loader.open();
      this.api.call('truecommand.update', [{ api_key: null, enabled: false }])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loader.close();
            this.dialogRef.close({ deregistered: true });
            this.dialogService.generalDialog({
              title: helptextTopbar.deregisterInfoDialog.title,
              message: helptextTopbar.deregisterInfoDialog.message,
              hideCancel: true,
            });
          },
          error: (error: unknown) => {
            this.loader.close();
            this.errorHandler.showErrorModal(error);
          },
        });
    });
  }
}
