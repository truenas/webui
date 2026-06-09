import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnIconComponent } from '@truenas/ui-components';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';

export interface SubsystemPartiallyCreatedDialogData {
  subsystem: NvmeOfSubsystem;
  relatedErrors: string[];
}

@Component({
  selector: 'ix-subsystem-partially-created-dialog',
  templateUrl: './subsystem-partially-created-dialog.component.html',
  styleUrls: ['./subsystem-partially-created-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TnIconComponent,
    FormActionsComponent,
    TranslateModule,
  ],
})
export class SubsystemPartiallyCreatedDialogComponent {
  protected dialogRef = inject<DialogRef<void, SubsystemPartiallyCreatedDialogComponent>>(DialogRef);
  data = inject<SubsystemPartiallyCreatedDialogData>(DIALOG_DATA);
}
