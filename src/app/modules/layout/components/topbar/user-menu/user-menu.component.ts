import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import helptext from 'app/helptext/topbar';
import { AboutDialogComponent } from 'app/modules/common/dialog/about/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';

@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  readonly tooltips = helptext.mat_tooltips;
  loggedInUser$ = this.authService.user$.pipe(filter(Boolean));

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
  ) { }

  openChangePasswordDialog(): void {
    this.dialog.open(ChangePasswordDialogComponent);
  }

  onShowAbout(): void {
    this.dialog.open(AboutDialogComponent, {
      disableClose: true,
    });
  }

  onTwoFactorAuth(): void {
    this.router.navigate(['/two-factor-auth']);
  }
}
