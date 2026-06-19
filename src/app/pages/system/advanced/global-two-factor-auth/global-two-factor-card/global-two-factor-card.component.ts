import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import {
  Observable, Subject, of, shareReplay, startWith, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { globalTwoFactorCardElements } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.elements';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-global-two-factor-card',
  styleUrls: ['./global-two-factor-card.component.scss'],
  templateUrl: './global-two-factor-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    UiSearchDirective,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TooltipComponent,
    GlobalTwoFactorAuthFormComponent,
    TranslateModule,
  ],
})
export class GlobalTwoFactorAuthCardComponent {
  private api = inject(ApiService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  readonly helpText = helptext2fa;
  protected readonly searchableElements = globalTwoFactorCardElements;
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  protected configOpen = signal(false);
  protected configForm = viewChild(GlobalTwoFactorAuthFormComponent);

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

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.configOpen.set(true));
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    if (saved) {
      this.reloadConfig$.next();
    }
  }
}
