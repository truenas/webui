import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter, map, of, switchMap } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { AuthService } from 'app/modules/auth/auth.service';
import {
  ChangePasswordDialog,
} from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { userMenuElements } from 'app/modules/layout/topbar/user-menu/user-menu.elements';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { guiFormClosedWithoutSaving } from 'app/store/preferences/preferences.actions';

@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatTooltip,
    MatMenuTrigger,
    TnIconComponent,
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
  private matDialog = inject(MatDialog);
  private slideIn = inject(SlideIn);
  private store$ = inject(Store);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly tooltips = helptextTopbar.tooltips;
  protected searchableElements = userMenuElements;
  protected readonly AccountAttribute = AccountAttribute;

  protected loggedInUser$ = this.authService.user$.pipe(filter(Boolean));
  protected isTwoFactorEnabledGlobally$ = this.authService.user$.pipe(
    switchMap((user) => {
      if (!user) {
        return of(false);
      }
      return this.authService.getGlobalTwoFactorConfig().pipe(
        map((config) => config.enabled),
      );
    }),
  );

  openChangePasswordDialog(): void {
    this.matDialog.open(ChangePasswordDialog);
  }

  openPreferencesForm(): void {
    this.slideIn.open(PreferencesFormComponent).pipe(
      filter((response) => !response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.store$.dispatch(guiFormClosedWithoutSaving()));
  }

  onTwoFactorAuth(): void {
    this.router.navigate(['/two-factor-auth']);
  }

  onSignOut(): void {
    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/signin']);
      });
  }
}
