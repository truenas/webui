import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ManualDiskSelectionLayout {
  // TODO:
}

@UntilDestroy()
@Component({
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualDiskSelectionComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ManualDiskSelectionLayout,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize('80vw', '80vh');
  }

  onSaveSelection(): void {
    // TODO: Return currently selected layout (ManualDiskSelectionLayout).
    this.dialogRef.close();
  }
}
