import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent } from '@truenas/ui-components';
import { FullScreenDialogOptions } from 'app/interfaces/dialog.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-full-screen-dialog',
  templateUrl: './full-screen-dialog.component.html',
  styleUrls: ['./full-screen-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class FullScreenDialog {
  dialogRef = inject<DialogRef<void, FullScreenDialog>>(DialogRef);
  protected data = inject<Partial<FullScreenDialogOptions>>(DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
