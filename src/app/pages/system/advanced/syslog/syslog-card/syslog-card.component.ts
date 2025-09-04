import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  Subject, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SyslogLevel, syslogLevelLabels } from 'app/enums/syslog.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SyslogServer } from 'app/interfaces/advanced-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { syslogCardElements } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.elements';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

export interface SyslogConfig {
  fqdn_syslog: boolean;
  sysloglevel: SyslogLevel;
  syslog_audit: boolean;
  syslogservers: SyslogServer[];
}

@UntilDestroy()
@Component({
  selector: 'ix-syslog-card',
  styleUrls: ['../../../general-settings/common-settings-card.scss'],
  templateUrl: './syslog-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
    MapValuePipe,
    YesNoPipe,
  ],
})
export class SyslogCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private translate = inject(TranslateService);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = syslogCardElements;

  protected formatSyslogServers(config: { syslogservers?: SyslogServer[] }): string {
    if (!config.syslogservers || config.syslogservers.length === 0) {
      return this.translate.instant('None');
    }

    return config.syslogservers
      .map((server) => {
        let serverStr = server.host;
        if (server.transport) {
          serverStr += ` (${server.transport})`;
        }
        return serverStr;
      })
      .join(', ');
  }

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  private syslogConfig: SyslogConfig;
  readonly advancedConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => {
      return this.store$.pipe(
        waitForAdvancedConfig,
        distinctUntilChanged((previous, current) => {
          const previousConfig: SyslogConfig = {
            fqdn_syslog: previous.fqdn_syslog,
            sysloglevel: previous.sysloglevel,
            syslog_audit: previous.syslog_audit,
            syslogservers: previous.syslogservers || [],
          };
          const currentConfig: SyslogConfig = {
            fqdn_syslog: current.fqdn_syslog,
            sysloglevel: current.sysloglevel,
            syslog_audit: current.syslog_audit,
            syslogservers: current.syslogservers || [],
          };
          return isEqual(previousConfig, currentConfig);
        }),
        map((config) => {
          return {
            fqdn_syslog: config.fqdn_syslog,
            sysloglevel: config.sysloglevel,
            syslog_audit: config.syslog_audit,
            syslogservers: config.syslogservers || [],
          };
        }),
      );
    }),
    tap((config) => this.syslogConfig = config),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  readonly syslogLevelLabels = syslogLevelLabels;

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.slideIn.open(SyslogFormComponent, { data: this.syslogConfig })),
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.reloadConfig$.next();
      },
    });
  }
}
