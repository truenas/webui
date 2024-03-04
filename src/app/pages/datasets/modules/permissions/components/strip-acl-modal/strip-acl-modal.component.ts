import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface StripAclModalData {
  path: string;
}

@UntilDestroy()
@Component({
  templateUrl: './strip-acl-modal.component.html',
  styleUrls: ['./strip-acl-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StripAclModalComponent {
  traverseCheckbox = new FormControl(false);

  readonly helptext = helptextAcl;

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private dialogRef: MatDialogRef<StripAclModalComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: StripAclModalData,
  ) { }

  onStrip(): void {
    const job$ = this.ws.job('filesystem.setacl', [{
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
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }
}
