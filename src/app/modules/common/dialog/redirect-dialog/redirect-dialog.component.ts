import {
  ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  RedirectDialogData,
} from './redirect-dialog-data.interface';

@Component({
  templateUrl: './redirect-dialog.component.html',
  styleUrls: ['./redirect-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectDialogComponent {
  @ViewChild('el', { static: false }) el: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<RedirectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RedirectDialogData,
  ) {}

  copyToClipboard(): void {
    this.el.nativeElement.focus();
    this.el.nativeElement.select();
    document.execCommand('copy');
  }
}
