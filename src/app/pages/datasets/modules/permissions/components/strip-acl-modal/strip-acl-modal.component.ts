import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface StripAclModalData {
  path: string;
}

@Component({
  selector: 'ix-strip-acl-modal',
  templateUrl: './strip-acl-modal.component.html',
  styleUrls: ['./strip-acl-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnCheckboxComponent, TnFormFieldComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class StripAclModalComponent {
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  protected dialogRef = inject<DialogRef>(DialogRef);
  private translate = inject(TranslateService);
  data = inject<StripAclModalData>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  traverseCheckbox = new FormControl(false);

  readonly helptext = helptextAcl;

  onStrip(): void {
    const job$ = this.api.job('filesystem.setacl', [{
      path: this.data.path,
      dacl: [],
      options: {
        recursive: true,
        traverse: Boolean(this.traverseCheckbox.value),
        stripacl: true,
      },
    }]);

    this.dialog.jobDialog(
      job$,
      {
        title: this.translate.instant('Stripping ACLs'),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }
}
