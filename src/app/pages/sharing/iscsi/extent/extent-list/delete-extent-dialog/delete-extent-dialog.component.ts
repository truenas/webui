import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './delete-extent-dialog.component.html',
  styleUrls: ['./delete-extent-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteExtentDialogComponent {
  form = this.formBuilder.group({
    remove: [false],
    force: [false],
  });

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public extent: IscsiExtent,
    private dialogRef: MatDialogRef<DeleteExtentDialogComponent>,
  ) { }

  get isFile(): boolean {
    return this.extent.type === IscsiExtentType.File;
  }

  onDelete(): void {
    const { remove, force } = this.form.value;

    this.ws.call('iscsi.extent.delete', [this.extent.id, remove, force])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
      });
  }
}
