import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { DeleteNamespaceParams, NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    IxCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    TestDirective,
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
