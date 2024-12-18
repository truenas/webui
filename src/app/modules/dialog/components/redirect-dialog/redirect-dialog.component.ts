import {
  ChangeDetectionStrategy, Component, ElementRef, Inject, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class RedirectDialogComponent {
  readonly el = viewChild.required<ElementRef<HTMLInputElement>>('el');

  constructor(
    public dialogRef: MatDialogRef<RedirectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RedirectDialogData,
  ) {}

  copyToClipboard(): void {
    this.el().nativeElement.focus();
    this.el().nativeElement.select();
    document.execCommand('copy');
  }
}
