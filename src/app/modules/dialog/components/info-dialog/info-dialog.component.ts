import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoDialogComponent {
  title: string;
  info: string;
  icon = 'info';
  isHtml = false;

  constructor(
    public dialogRef: MatDialogRef<InfoDialogComponent>,
  ) {}
}
