import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnDividerComponent } from '@truenas/ui-components';
import { ErrorReport } from 'app/interfaces/error-report.interface';
import { ErrorTemplateComponent } from 'app/modules/dialog/components/multi-error-dialog/error-template/error-template.component';

@Component({
  selector: 'ix-multi-error-dialog',
  templateUrl: './multi-error-dialog.component.html',
  styleUrls: ['./multi-error-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    ErrorTemplateComponent,
    TnDividerComponent,
    TranslateModule,
  ],
})
export class MultiErrorDialog {
  dialogRef = inject<DialogRef<boolean, MultiErrorDialog>>(DialogRef);
  errors = inject<ErrorReport[]>(DIALOG_DATA);
}
