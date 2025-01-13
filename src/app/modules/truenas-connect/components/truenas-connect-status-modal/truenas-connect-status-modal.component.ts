import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatDivider } from '@angular/material/divider';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MatButton } from '@angular/material/button';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';


@Component({
  selector: 'ix-truenas-connect-status-modal',
  standalone: true,
  imports: [TranslateModule, MatDivider, MatDialogTitle, MatDialogContent, IxIconComponent, MatButton, MatDialogActions],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TruenasConnectStatusModalComponent {
  readonly TruenasConnectStatus = TruenasConnectStatus;

  constructor(@Inject(MAT_DIALOG_DATA) public config: TruenasConnectConfig) {}
}
