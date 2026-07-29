import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { DeleteNamespaceParams, NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-delete-namespace-dialog',
  templateUrl: './delete-namespace-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    TnCheckboxComponent, TnFormFieldComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
  ],
})
export class DeleteNamespaceDialogComponent {
  protected dialogRef = inject<DialogRef<unknown, DeleteNamespaceDialogComponent>>(DialogRef);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  protected namespace = inject<NvmeOfNamespace>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  readonly removeFileControl = new FormControl(false);

  protected get isFile(): boolean {
    return this.namespace.device_type === NvmeOfNamespaceType.File;
  }

  protected onDelete(): void {
    const params: DeleteNamespaceParams = [this.namespace.id];
    if (this.isFile && this.removeFileControl.value) {
      params.push({ remove: true });
    }

    this.api.call('nvmet.namespace.delete', params)
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Namespace deleted.'));
        this.dialogRef.close(true);
      });
  }
}
