import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    IxIconModule,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    TestIdModule,
    TranslateModule,
  ],
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
