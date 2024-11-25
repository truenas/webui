import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { AboutDialogComponent } from 'app/modules/layout/components/topbar/about-dialog/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/topbar/change-password-dialog/change-password-dialog.component';
import { userMenuElements } from 'app/modules/layout/components/topbar/user-menu/user-menu.elements';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  readonly tooltips = helptextTopbar.mat_tooltips;
  loggedInUser$ = this.authService.user$.pipe(filter(Boolean));
  protected searchableElements = userMenuElements;
  protected readonly AccountAttribute = AccountAttribute;

  constructor(
    private matDialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private wsManager: WebSocketConnectionService,
  ) { }

  openChangePasswordDialog(): void {
    this.matDialog.open(ChangePasswordDialogComponent);
  }

  onShowAbout(): void {
    this.matDialog.open(AboutDialogComponent, {
      disableClose: true,
    });
  }

  onTwoFactorAuth(): void {
    this.router.navigate(['/two-factor-auth']);
  }

  onSignOut(): void {
    this.authService.logout().pipe(untilDestroyed(this)).subscribe(() => {
      this.authService.clearAuthToken();
      this.wsManager.isClosed$ = true;
    });
  }
}
