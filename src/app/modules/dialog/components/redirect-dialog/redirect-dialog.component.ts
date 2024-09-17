import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import {
  RedirectDialogData,
} from './redirect-dialog-data.interface';

@Component({
  selector: 'ix-redirect-dialog',
  templateUrl: './redirect-dialog.component.html',
  styleUrls: ['./redirect-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    TestIdModule,
    MatDialogActions,
    MatButton,
    TranslateModule,
  ],
})
export class RedirectDialogComponent {
  @ViewChild('el', { static: false }) el: ElementRef<HTMLInputElement>;

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
