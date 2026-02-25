import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    TnIconComponent,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class InfoDialog {
  dialogRef = inject<MatDialogRef<InfoDialog>>(MatDialogRef);

  title: string;
  info: string;
  icon = 'information';
  isHtml = false;
}
