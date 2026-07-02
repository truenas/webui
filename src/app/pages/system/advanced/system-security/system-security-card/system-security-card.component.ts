import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import {
  Subject, shareReplay, startWith, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { passwordComplexityRulesetLabels } from 'app/enums/password-complexity-ruleset.enum';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
    WithLoadingStateDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    UiSearchDirective,
  ],
})
export class SystemSecurityCardComponent {
  protected readonly searchableElements = systemSecurityCardElements;

  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  readonly systemSecurityConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.api.call('system.security.config').pipe(toLoadingState())),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  protected readonly rulesetLabels = passwordComplexityRulesetLabels;

  onConfigure(): void {
    this.formPanel.open(SystemSecurityFormComponent, { title: this.translate.instant('System Security') })
      .onSuccess(() => this.reloadConfig$.next(), this.destroyRef);
  }
}
