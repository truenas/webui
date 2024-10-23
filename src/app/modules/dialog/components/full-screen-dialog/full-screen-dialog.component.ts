import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FullScreenDialogOptions } from 'app/interfaces/dialog.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-full-screen-dialog',
  templateUrl: './full-screen-dialog.component.html',
  styleUrls: ['./full-screen-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class FullScreenDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<FullScreenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) protected data: Partial<FullScreenDialogOptions>,
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
