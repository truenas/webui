import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/api-keys';
import { ApiKey, UpdateApiKeyRequest } from 'app/interfaces/api-key.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  KeyCreatedDialogComponent,
} from 'app/pages/api-keys/components/key-created-dialog/key-created-dialog.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import { WebSocketService, AppLoaderService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './api-key-form-dialog.component.html',
  styleUrls: ['./api-key-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyFormDialogComponent implements OnInit {
  form = this.fb.group({
    name: ['', [Validators.required]],
    reset: [false],
  });

  readonly tooltips = {
    name: helptext.name.tooltip,
    reset: helptext.reset.tooltip,
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
    this.loader.open();
    const values = this.form.value;
    const request$ = this.isNew
      ? this.ws.call('api_key.create', [{ name: values.name, allowlist: [{ method: '*', resource: '*' }] }])
      : this.ws.call('api_key.update', [this.editingRow.id, values] as UpdateApiKeyRequest);

    request$
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (apiKey) => {
          if (this.isNew) {
            this.store.apiKeyAdded(apiKey);
          } else {
            this.store.apiKeyEdited(apiKey);
          }
          this.loader.close();
          this.dialogRef.close(true);

          if (apiKey.key) {
            this.matDialog.open(KeyCreatedDialogComponent, {
              data: apiKey.key,
            });
          }
        },
        error: (error) => {
          this.loader.close();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
