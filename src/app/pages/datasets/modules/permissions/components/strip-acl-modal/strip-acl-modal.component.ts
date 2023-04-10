import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';

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

  readonly helptext = helptext;

  constructor(
    private matDialog: MatDialog,
    private dialogRef: MatDialogRef<StripAclModalComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: StripAclModalData,
  ) { }

  onStrip(): void {
    const jobDialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Stripping ACLs'),
      },
    });
    jobDialogRef.componentInstance.setDescription(this.translate.instant('Stripping ACLs...'));

    jobDialogRef.componentInstance.setCall('filesystem.setacl', [{
      path: this.data.path,
      dacl: [],
      options: {
        recursive: true,
        traverse: Boolean(this.traverseCheckbox.value),
        stripacl: true,
      },
    }]);
    jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      jobDialogRef.close(true);
      this.dialogRef.close(true);
    });
    jobDialogRef.componentInstance.submit();
  }
}
