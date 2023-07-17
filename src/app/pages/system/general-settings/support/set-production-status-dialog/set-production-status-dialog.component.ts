import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';

export interface SetProductionStatusDialogResult {
  sendInitialDebug: boolean;
}

@UntilDestroy()
@Component({
  templateUrl: './set-production-status-dialog.component.html',
  styleUrls: ['./set-production-status-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetProductionStatusDialogComponent {
  sendInitialDebugCheckbox = new FormControl(false);

  constructor(
    private loader: AppLoaderService,
    private dialogRef: MatDialogRef<SetProductionStatusDialogComponent, SetProductionStatusDialogResult>,
  ) { }

  onSubmit(): void {
    this.dialogRef.close({ sendInitialDebug: this.sendInitialDebugCheckbox.value });
  }
}
