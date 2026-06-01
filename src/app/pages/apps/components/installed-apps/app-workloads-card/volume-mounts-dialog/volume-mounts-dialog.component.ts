import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent, TnIconComponent } from '@truenas/ui-components';
import { MatButton, MatIconButton } from '@angular/material/button';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
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
    MatButton,
    TestDirective,
    TnIconComponent,
    MatIconButton,
    FormActionsComponent,
  ],
})
export class VolumeMountsDialog {
  protected containerDetails = inject<AppContainerDetails>(DIALOG_DATA);
}
