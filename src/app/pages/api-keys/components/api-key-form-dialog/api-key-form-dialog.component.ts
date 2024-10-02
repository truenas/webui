import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApiKeys } from 'app/helptext/api-keys';
import { ApiKey, UpdateApiKeyRequest } from 'app/interfaces/api-key.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  KeyCreatedDialogComponent,
} from 'app/pages/api-keys/components/key-created-dialog/key-created-dialog.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
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
  protected readonly requiredRoles = [Role.FullAdmin];

  form = this.fb.group({
    name: ['', [Validators.required]],
    reset: [false],
  });

  readonly tooltips = {
    name: helptextApiKeys.name.tooltip,
    reset: helptextApiKeys.reset.tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApiKeyFormDialogComponent>,
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: FormErrorHandlerService,
    private store: ApiKeyComponentStore,
    @Inject(MAT_DIALOG_DATA) private editingRow: ApiKey,
  ) {}

  ngOnInit(): void {
    if (!this.isNew) {
      this.form.patchValue(this.editingRow);
    }
  }

  get isNew(): boolean {
    return !this.editingRow;
  }

  onSubmit(): void {
    const values = this.form.value;
    const request$ = this.isNew
      ? this.ws.call('api_key.create', [{ name: values.name, allowlist: [{ method: '*', resource: '*' }] }])
      : this.ws.call('api_key.update', [this.editingRow.id, values] as UpdateApiKeyRequest);

    request$
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (apiKey) => {
          if (this.isNew) {
            this.store.apiKeyAdded(apiKey);
          } else {
            this.store.apiKeyEdited(apiKey);
          }
          this.dialogRef.close(true);

          if (apiKey.key) {
            this.matDialog.open(KeyCreatedDialogComponent, {
              data: apiKey.key,
            });
          }
        },
        error: (error: unknown) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.loader.close();
        },
      });
  }
}
