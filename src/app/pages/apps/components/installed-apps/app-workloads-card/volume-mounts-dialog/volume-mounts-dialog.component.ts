import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AppContainerDetails } from 'app/interfaces/app.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-volume-mounts-dialog',
  styleUrls: ['./volume-mounts-dialog.component.scss'],
  templateUrl: './volume-mounts-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    MatButton,
    TestDirective,
    IxIconComponent,
    MatIconButton,
    MatDialogContent,
    FormActionsComponent,
    MatDialogClose,
  ],
})
export class VolumeMountsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) protected containerDetails: AppContainerDetails,
  ) {}
}
