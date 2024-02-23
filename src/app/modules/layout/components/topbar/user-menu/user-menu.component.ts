import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { AboutDialogComponent } from 'app/modules/layout/components/topbar/about-dialog/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/topbar/change-password-dialog/change-password-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';

@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  readonly tooltips = helptextTopbar.mat_tooltips;
  loggedInUser$ = this.authService.user$.pipe(filter(Boolean));

  constructor(
    private matDialog: MatDialog,
    private authService: AuthService,
    private router: Router,
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

  protected readonly AccountAttribute = AccountAttribute;
}
