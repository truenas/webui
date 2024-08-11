import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppContainerDetails } from 'app/interfaces/app.interface';

@Component({
  selector: 'ix-volume-mounts-dialog',
  styleUrls: ['./volume-mounts-dialog.component.scss'],
  templateUrl: './volume-mounts-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeMountsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) protected containerDetails: AppContainerDetails,
  ) {}
}
