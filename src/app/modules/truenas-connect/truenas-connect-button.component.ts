import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {MatBadgeModule} from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { TruenasConnectModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-modal/truenas-connect-modal.component';
import { Role } from 'app/enums/role.enum';
import { TruecommandSignupModalComponent } from 'app/modules/truecommand/components/truecommand-signup-modal/truecommand-signup-modal.component';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-button',
  standalone: true,
  imports: [IxIconComponent, MatButtonModule, MatBadgeModule],
  templateUrl: './truenas-connect-button.component.html',
  styleUrl: './truenas-connect-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TruenasConnectButtonComponent {
  status = 'disconnected'
  constructor(private matDialog: MatDialog) {

  }

  openSignupDialog() {
    this.connect()
    // this.matDialog.open(TruecommandSignupModalComponent, {
    //   width: '350px'
    // })
    //   .afterClosed()
    //   .pipe(untilDestroyed(this))
    //   .subscribe((shouldConnect) => {
    //     if (!shouldConnect) {
    //       return;
    //     }

    //     this.connect();
    //     // this.handleUpdate();
    //   });
  }

  connect() {
    this.matDialog
      .open(TruenasConnectModalComponent, {
        // maxWidth: '420px',
        // minWidth: '416px',
        width: '456px'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe()
  }

  start() {
    console.log('start truenas connect')
  }
  
  stop() {
    console.log('stop truenas connect')
  }
}
