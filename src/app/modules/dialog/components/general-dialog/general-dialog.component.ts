import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

export interface GeneralDialogConfig {
  title?: string;
  message: string;
  icon?: string;
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
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TestIdModule,
    TranslateModule,
  ],
})
export class GeneralDialogComponent {
  @Input() conf: GeneralDialogConfig;

  constructor(
    public dialogRef: MatDialogRef<GeneralDialogComponent>,
  ) { }
}
