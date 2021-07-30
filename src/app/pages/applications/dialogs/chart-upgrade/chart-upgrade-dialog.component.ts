import {
  Component, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { ChartUpgradeDialogConfig } from 'app/pages/applications/interfaces/chart-upgrade-dialog-config.interface';

@Component({
  selector: 'chart-upgrade-dialog',
  styleUrls: ['./chart-upgrade-dialog.component.scss'],
  templateUrl: './chart-upgrade-dialog.component.html',
})

export class ChartUpgradeDialog {
  dialogConfig: ChartUpgradeDialogConfig;
  imagePlaceholder = appImagePlaceholder;
  helptext = helptext;

  constructor(
    public dialogRef: MatDialogRef<ChartUpgradeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.dialogConfig = data;
  }

  hasUpdateImages(): boolean {
    return Object.keys(this.dialogConfig.upgradeSummary.container_images_to_update).length > 0;
  }
}
