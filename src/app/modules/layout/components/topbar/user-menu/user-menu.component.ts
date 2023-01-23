import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import helptext from 'app/helptext/topbar';
import { AboutDialogComponent } from 'app/modules/common/dialog/about/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';
import { WebSocketService } from 'app/services';

@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  readonly tooltips = helptext.mat_tooltips;
  loggedInUser$ = this.ws.loggedInUser$.pipe(filter(Boolean));

  constructor(
    private dialog: MatDialog,
    private ws: WebSocketService,
  ) { }

  openChangePasswordDialog(): void {
    this.dialog.open(ChangePasswordDialogComponent);
  }

  onShowAbout(): void {
    this.dialog.open(AboutDialogComponent, {
      disableClose: true,
    });
  }
}
