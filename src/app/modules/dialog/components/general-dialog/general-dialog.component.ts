import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface GeneralDialogConfig {
  title?: string;
  message: string;
  icon?: MarkedIcon;
  is_html?: boolean;
  hideCancel?: boolean;
  cancelBtnMsg?: string;
  confirmBtnMsg?: string;
}
/**
 * General Dialog Component
 *
 * - able to be used as simple dialog to display text content, alert dialog with icon,
 * confirm dialog with single checkbox, able to display text as html or not
 * - works with MatDialogConf
 * - use interface GeneralDialogConfig for general config
 */
@Component({
  selector: 'ix-general-dialog',
  templateUrl: './general-dialog.component.html',
  styleUrls: ['./general-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    IxIconComponent,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class GeneralDialogComponent {
  constructor(
    protected dialogRef: MatDialogRef<GeneralDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public conf: GeneralDialogConfig,
  ) { }
}
