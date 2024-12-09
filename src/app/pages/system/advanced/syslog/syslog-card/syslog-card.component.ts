import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  Subject, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SyslogLevel, SyslogTransport, syslogLevelLabels } from 'app/enums/syslog.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { syslogCardElements } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.elements';
import { SyslogFormComponent } from 'app/pages/system/advanced/syslog/syslog-form/syslog-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

export interface SyslogConfig {
  fqdn_syslog: boolean;
  sysloglevel: SyslogLevel;
  syslogserver: string;
  syslog_transport: SyslogTransport;
  syslog_audit: boolean;
  syslog_tls_certificate: number;
  syslog_tls_certificate_authority: number;
}

@UntilDestroy()
@Component({
  selector: 'ix-syslog-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './syslog-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = syslogCardElements;
  protected readonly requiredRoles = [Role.FullAdmin];

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
            syslogserver: previous.syslogserver,
            syslog_transport: previous.syslog_transport,
            syslog_audit: previous.syslog_audit,
            syslog_tls_certificate: previous.syslog_tls_certificate,
            syslog_tls_certificate_authority: previous.syslog_tls_certificate_authority,
          };
          const currentConfig: SyslogConfig = {
            fqdn_syslog: current.fqdn_syslog,
            sysloglevel: current.sysloglevel,
            syslogserver: current.syslogserver,
            syslog_transport: current.syslog_transport,
            syslog_audit: current.syslog_audit,
            syslog_tls_certificate: current.syslog_tls_certificate,
            syslog_tls_certificate_authority: current.syslog_tls_certificate_authority,
          };
          return isEqual(previousConfig, currentConfig);
        }),
        map((config) => {
          return {
            fqdn_syslog: config.fqdn_syslog,
            sysloglevel: config.sysloglevel,
            syslogserver: config.syslogserver,
            syslog_transport: config.syslog_transport,
            syslog_audit: config.syslog_audit,
            syslog_tls_certificate: config.syslog_tls_certificate,
            syslog_tls_certificate_authority: config.syslog_tls_certificate_authority,
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

  constructor(
    private store$: Store<AppState>,
    private chainedSlideIns: ChainedSlideInService,
    private firstTimeWarning: FirstTimeWarningService,
  ) {}

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(SyslogFormComponent, false, this.syslogConfig)),
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.reloadConfig$.next();
      },
    });
  }
}
