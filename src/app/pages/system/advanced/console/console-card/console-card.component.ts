import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import {
  Subject, distinctUntilChanged, map, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { consoleCardElements } from 'app/pages/system/advanced/console/console-card/console-card.elements';
import { getConsoleFormConfig } from 'app/pages/system/advanced/console/console-form/console.form-config';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

export interface ConsoleConfig {
  consolemenu: boolean;
  serialconsole: boolean;
  serialport: string;
  serialspeed: string;
  motd: string;
}

@Component({
  selector: 'ix-console-card',
  styleUrls: ['./console-card.component.scss'],
  templateUrl: './console-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class ConsoleCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];
  private consoleConfig: ConsoleConfig;
  protected readonly searchableElements = consoleCardElements;

  readonly advancedConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.store$),
    waitForAdvancedConfig,
    distinctUntilChanged((previous, current) => {
      const prevConfig: ConsoleConfig = {
        consolemenu: previous.consolemenu,
        serialconsole: previous.serialconsole,
        serialport: previous.serialport,
        serialspeed: previous.serialspeed,
        motd: previous.motd,
      };
      const currentConfig: ConsoleConfig = {
        consolemenu: current.consolemenu,
        serialconsole: current.serialconsole,
        serialport: current.serialport,
        serialspeed: current.serialspeed,
        motd: current.motd,
      };
      return isEqual(prevConfig, currentConfig);
    }),
    map((config) => ({
      consolemenu: config.consolemenu,
      serialconsole: config.serialconsole,
      serialport: config.serialport,
      serialspeed: config.serialspeed,
      motd: config.motd,
    })),
    tap((consoleConfig) => {
      this.consoleConfig = consoleConfig;
    }),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.formPanel.openForm(getConsoleFormConfig(this.api, this.translate, this.store$), {
        title: this.translate.instant('Console'),
        editData: this.consoleConfig,
      }).success$),
      tap(() => this.reloadConfig$.next()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
