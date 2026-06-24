import { ChangeDetectionStrategy, Component, inject, viewChild, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import {
  Observable, Subject, of, shareReplay, startWith, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { passwordComplexityRulesetLabels } from 'app/enums/password-complexity-ruleset.enum';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { systemSecurityCardElements } from 'app/pages/system/advanced/system-security/system-security-card/system-security-card.elements';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';

@Component({
  selector: 'ix-system-security-card',
  styleUrls: ['./system-security-card.component.scss'],
  templateUrl: './system-security-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    UiSearchDirective,
    SystemSecurityFormComponent,
  ],
})
export class SystemSecurityCardComponent {
  protected readonly searchableElements = systemSecurityCardElements;

  private api = inject(ApiService);
  private unsavedChanges = inject(UnsavedChangesService);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  protected configOpen = signal(false);
  protected configForm = viewChild(SystemSecurityFormComponent);

  readonly systemSecurityConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.api.call('system.security.config').pipe(toLoadingState())),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  protected readonly rulesetLabels = passwordComplexityRulesetLabels;

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  onConfigure(): void {
    this.configOpen.set(true);
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    if (saved) {
      this.reloadConfig$.next();
    }
  }
}
