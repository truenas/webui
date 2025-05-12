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
import { filter, map } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  ChangePasswordDialog,
} from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { userMenuElements } from 'app/modules/layout/topbar/user-menu/user-menu.elements';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatTooltip,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    RouterLink,
    MatDivider,
    AsyncPipe,
    TranslateModule,
    UiSearchDirective,
    TestDirective,
  ],
})
export class UserMenuComponent {
  protected readonly tooltips = helptextTopbar.mat_tooltips;
  protected searchableElements = userMenuElements;
  protected readonly AccountAttribute = AccountAttribute;

  protected loggedInUser$ = this.authService.user$.pipe(filter(Boolean));
  protected isTwoFactorEnabledGlobally$ = this.authService.getGlobalTwoFactorConfig().pipe(
    map((config) => config.enabled),
  );

  constructor(
    private matDialog: MatDialog,
    private authService: AuthService,
    private router: Router,
  ) { }

  openChangePasswordDialog(): void {
    this.matDialog.open(ChangePasswordDialog);
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
