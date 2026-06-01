import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { AppContainerDetails } from 'app/interfaces/app.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-volume-mounts-dialog',
  styleUrls: ['./volume-mounts-dialog.component.scss'],
  templateUrl: './volume-mounts-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    TnButtonComponent,
    TestDirective,
    FormActionsComponent,
  ],
})
export class VolumeMountsDialog {
  protected containerDetails = inject<AppContainerDetails>(DIALOG_DATA);
  protected dialogRef = inject<DialogRef<unknown, VolumeMountsDialog>>(DialogRef);
}
