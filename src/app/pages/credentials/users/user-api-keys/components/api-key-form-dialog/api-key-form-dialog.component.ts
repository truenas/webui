import {
  ChangeDetectionStrategy, Component, computed, inject, OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApiKeys } from 'app/helptext/api-keys';
import { ApiKey, UpdateApiKeyRequest } from 'app/interfaces/api-key.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { KeyCreatedDialogComponent } from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-api-key-form-dialog',
  templateUrl: './api-key-form-dialog.component.html',
  styleUrls: ['./api-key-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ApiKeyFormDialogComponent implements OnInit {
  protected readonly isNew = computed(() => !this.editingRow());
  protected readonly requiredRoles = [Role.ApiKeyWrite, Role.SharingAdmin, Role.ReadonlyAdmin];
  protected readonly username = toSignal(this.authService.user$.pipe(map((user) => user.pw_name)));
  protected readonly tooltips = {
    name: helptextApiKeys.name.tooltip,
    reset: helptextApiKeys.reset.tooltip,
  };

  protected readonly form = this.fb.group({
    name: ['', [Validators.required]],
    reset: [false],
  });

  protected readonly forbiddenNames$ = this.ws.call('api_key.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(map((keys) => keys.map((key) => key.name)));

  private readonly editingRow = signal(inject<ApiKey>(MAT_DIALOG_DATA));

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApiKeyFormDialogComponent>,
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: FormErrorHandlerService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.addForbiddenNamesValidator();
    if (!this.isNew()) {
      this.form.patchValue(this.editingRow());
    }
  }

  onSubmit(): void {
    const username = this.username();
    const values = { ...this.form.value };
    const request$ = this.isNew()
      ? this.ws.call('api_key.create', [{ name: values.name, username }])
      : this.ws.call('api_key.update', [this.editingRow().id, {
        name: values.name,
        reset: Boolean(values?.reset),
      }] as UpdateApiKeyRequest);

    request$
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (apiKey) => {
          this.dialogRef.close(true);

          if (apiKey.keyhash) {
            this.matDialog.open(KeyCreatedDialogComponent, {
              data: apiKey.keyhash,
            });
          }
        },
        error: (error: unknown) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.loader.close();
        },
      });
  }

  protected addForbiddenNamesValidator(): void {
    this.form.controls.name.setAsyncValidators(forbiddenAsyncValues(this.forbiddenNames$));
    this.form.controls.name.updateValueAndValidity();
  }
}
