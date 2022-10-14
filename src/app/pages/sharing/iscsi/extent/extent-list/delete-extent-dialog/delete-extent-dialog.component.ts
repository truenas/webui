import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

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
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public extent: IscsiExtent,
    private dialogRef: MatDialogRef<DeleteExtentDialogComponent>,
    private dialogService: DialogService,
  ) { }

  get isFile(): boolean {
    return this.extent.type === IscsiExtentType.File;
  }

  onDelete(): void {
    this.loader.open();
    const { remove, force } = this.form.value;

    this.ws.call('iscsi.extent.delete', [this.extent.id, remove, force])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }
}
