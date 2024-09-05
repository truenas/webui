import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AboutDialogComponent } from 'app/modules/layout/topbar/about-dialog/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { userMenuElements } from 'app/modules/layout/topbar/user-menu/user-menu.elements';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestIdModule,
    MatTooltip,
    CommonDirectivesModule,
    MatMenuTrigger,
    IxIconModule,
    MatMenu,
    MatMenuItem,
    RouterLink,
    MatDivider,
    AsyncPipe,
    TranslateModule,
  ],
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
    this.authService.logout()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.router.navigate(['/signin']);
      });
  }
}
