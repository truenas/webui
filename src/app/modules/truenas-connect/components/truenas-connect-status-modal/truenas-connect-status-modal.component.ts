import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions,
  MatDialog,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TruenasConnectModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-modal/truenas-connect-modal.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'ix-truenas-connect-status-modal',
  standalone: true,
  imports: [
    MatDivider,
    MatDialogTitle,
    MatDialogContent,
    IxIconComponent,
    MatButton,
    MatDialogActions,
  ],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectStatusModalComponent implements OnInit {
  readonly TruenasConnectStatus = TruenasConnectStatus;

  constructor(@Inject(MAT_DIALOG_DATA) public config: TruenasConnectConfig, @Inject(WINDOW) private window: Window, private api: ApiService, private matDialog: MatDialog) { }

  ngOnInit(): void {
    
  }

  openConnectDialog(): void {
    this.matDialog
      .open(TruenasConnectModalComponent, {
        width: '456px',
      })
      .afterClosed()
      .subscribe();
  }

  generateToken() {
    console.log('generating a token')
    this.api.call('tn_connect.generate_claim_token')
      .subscribe({
        next: (token) => {
          console.log('token', token)
        },
        error: err => console.log('errror', err)
      });
    }

    reenable() {
      this.api.call('tn_connect.ip_choices')
      .pipe(
        switchMap((ipsRes) => {
          console.log('ipRes', ipsRes)
          const ips = Object.values(ipsRes);
          return this.api.call('tn_connect.update', [{
            enabled: false,
            ips,
          }]);
        }),
        switchMap((ipsRes) => {
          console.log('ipRes', ipsRes)
          const ips = Object.values(ipsRes);
          return this.api.call('tn_connect.update', [{
            enabled: true,
            ips,
          }]);
        }),
      )
      .subscribe({
        next: res => {
          console.log('reenable', res)
        },
        error: err => {
          console.log('err', err)
        }
      })
    }
}
