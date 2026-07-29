import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import {
  Subject, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { globalTwoFactorCardElements } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.elements';
import {
  getGlobalTwoFactorFormConfig,
} from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor.form-config';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-global-two-factor-card',
  styleUrls: ['./global-two-factor-card.component.scss'],
  templateUrl: './global-two-factor-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TooltipComponent,
    TranslateModule,
  ],
})
export class GlobalTwoFactorAuthCardComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private window = inject<Window>(WINDOW);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  readonly helpText = helptext2fa;
  protected readonly searchableElements = globalTwoFactorCardElements;
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  private readonly reloadConfig$ = new Subject<void>();

  readonly twoFactorConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.api.call('auth.twofactor.config')),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  onConfigurePressed(twoFactorAuthConfig: GlobalTwoFactorConfig): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.formPanel.openForm(
        getGlobalTwoFactorFormConfig(
          this.api,
          this.translate,
          this.dialogService,
          this.authService,
          this.router,
          this.window,
          twoFactorAuthConfig,
        ),
        {
          title: this.translate.instant('Global Two Factor Authentication'),
          editData: {
            enabled: twoFactorAuthConfig.enabled,
            window: twoFactorAuthConfig.window,
            ssh: twoFactorAuthConfig.services.ssh,
          },
        },
      ).success$),
      tap(() => this.reloadConfig$.next()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
