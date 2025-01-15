import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TruenasConnectModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-modal/truenas-connect-modal.component';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-button',
  standalone: true,
  imports: [IxIconComponent, MatButtonModule, MatBadgeModule, MatIconButton],
  templateUrl: './truenas-connect-button.component.html',
  styleUrl: './truenas-connect-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectButtonComponent implements OnInit {
  config: TruenasConnectConfig;
  readonly TruenasConnectStatus = TruenasConnectStatus;

  constructor(private matDialog: MatDialog, private api: ApiService, private tnc: TruenasConnectService) {
  }

  ngOnInit(): void {
  }
  showModal(): void {
    this.matDialog.open(TruenasConnectStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      position: {
        top: '48px',
        right: '0px',
      },
      data: this.tnc.config.getValue(),
    });
  }
}
