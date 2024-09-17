import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { ErrorTemplateComponent } from 'app/modules/dialog/components/multi-error-dialog/error-template/error-template.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-multi-error-dialog',
  templateUrl: './multi-error-dialog.component.html',
  styleUrls: ['./multi-error-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    ErrorTemplateComponent,
    MatDivider,
    MatDialogActions,
    MatButton,
    TestIdModule,
    TranslateModule,
  ],
})
export class MultiErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MultiErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public errors: ErrorReport[],
  ) {}
}
