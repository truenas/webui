import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnDialog,
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { filter, map, of, switchMap } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { AuthService } from 'app/modules/auth/auth.service';
import {
  ChangePasswordDialog,
} from 'app/modules/layout/topbar/change-password-dialog/change-password-dialog.component';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { userMenuElements } from 'app/modules/layout/topbar/user-menu/user-menu.elements';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { guiFormClosedWithoutSaving } from 'app/store/preferences/preferences.actions';

@Component({
  selector: 'ix-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    TnTestIdDirective,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TranslateModule,
    UiSearchDirective,
  ],
})
export class UserMenuComponent {
  private tnDialog = inject(TnDialog);
  private slideIn = inject(SlideIn);
  private store$ = inject(Store);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private window = inject<Window>(WINDOW);

  protected readonly tooltips = helptextTopbar.tooltips;
  protected searchableElements = userMenuElements;
  protected readonly AccountAttribute = AccountAttribute;

  protected readonly loggedInUser = toSignal(this.authService.user$.pipe(filter(Boolean)));
  protected readonly isTwoFactorEnabledGlobally = toSignal(
    this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of(false);
        }
        return this.authService.getGlobalTwoFactorConfig().pipe(
          map((config) => config.enabled),
        );
      }),
    ),
    { initialValue: false },
  );

  openChangePasswordDialog(): void {
    this.tnDialog.open(ChangePasswordDialog);
  }

  openPreferencesForm(): void {
    this.slideIn.open(PreferencesFormComponent)
      .onCancel(() => this.store$.dispatch(guiFormClosedWithoutSaving()), this.destroyRef);
  }

  onTwoFactorAuth(): void {
    this.router.navigate(['/two-factor-auth']);
  }

  openMyApiKeys(): void {
    this.router.navigate(['/credentials/users/api-keys'], {
      queryParams: { userName: this.loggedInUser()?.pw_name },
    });
  }

  openGuide(): void {
    this.window.open('https://www.truenas.com/docs/', '_blank');
  }

  onSignOut(): void {
    this.authService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/signin']);
      });
  }
}
