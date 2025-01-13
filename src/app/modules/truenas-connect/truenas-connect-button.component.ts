import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {MatBadge, MatBadgeSize, MatBadgeModule} from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { TruenasConnectModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-modal/truenas-connect-modal.component';
import { Role } from 'app/enums/role.enum';
import { TruecommandSignupModalComponent } from 'app/modules/truecommand/components/truecommand-signup-modal/truecommand-signup-modal.component';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { TruenasConnectSignupModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-signup-modal/truenas-connect-signup-modal.component';
import { TruenasConnectStatus, TruenasConnectStatusKey } from 'app/enums/truenas-connect-status.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-button',
  standalone: true,
  imports: [IxIconComponent, MatButtonModule, MatBadgeModule, MatIconButton],
  templateUrl: './truenas-connect-button.component.html',
  styleUrl: './truenas-connect-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TruenasConnectButtonComponent implements OnInit {
  status = TruenasConnectStatus
  statusKey: TruenasConnectStatusKey
  config: TruenasConnectConfig;

  constructor(private matDialog: MatDialog, private api: ApiService) {
  }

  ngOnInit(): void {
    this.api.call('tn_connect.config' as any, [])
      .subscribe(config => {
        this.config = config
      })
  }

  openConnect() {
    this.matDialog
      .open(TruenasConnectModalComponent, {
        width: '456px'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe()
  } 

  start() {
    console.log('start truenas connect')
  }
  
  showStatus() {
    this.matDialog.open(TruenasConnectStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      position: {
        top: '48px',
        right: '0px',
      },
      data: this.config
    });
  }
}
