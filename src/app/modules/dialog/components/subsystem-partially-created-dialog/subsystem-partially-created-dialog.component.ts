import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-subsystem-partially-created-dialog',
  templateUrl: './subsystem-partially-created-dialog.component.html',
  styleUrls: ['./subsystem-partially-created-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    TestDirective,
    TranslateModule,
    IxIconComponent,
  ],
})
export class SubsystemPartiallyCreatedDialogComponent {
  dialogRef = inject<MatDialogRef<SubsystemPartiallyCreatedDialogComponent>>(MatDialogRef);
  data = inject<{
    subsystem: NvmeOfSubsystem;
    relatedErrors: string[];
  }>(MAT_DIALOG_DATA);
}
