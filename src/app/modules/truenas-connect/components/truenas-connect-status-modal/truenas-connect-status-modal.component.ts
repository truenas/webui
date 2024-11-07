import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatDivider } from '@angular/material/divider';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MatButton } from '@angular/material/button';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';


@Component({
  selector: 'ix-truenas-connect-status-modal',
  standalone: true,
  imports: [TranslateModule, MatDivider, MatDialogTitle, MatDialogContent, IxIconComponent, MatButton, MatDialogActions],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TruenasConnectStatusModalComponent {
  status = TruenasConnectStatus.Disabled
  reason = 'Truenas Connect service is disabled.'
  readonly TruenasConnectStatus = TruenasConnectStatus;

}
