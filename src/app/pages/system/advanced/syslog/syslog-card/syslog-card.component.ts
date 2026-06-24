import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import {
  Observable, Subject, distinctUntilChanged, map, of, shareReplay, startWith, switchMap, take,
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
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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

@Component({
  selector: 'ix-syslog-card',
  styleUrls: ['./syslog-card.component.scss'],
  templateUrl: './syslog-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    WithLoadingStateDirective,
    SyslogFormComponent,
    TranslateModule,
    MapValuePipe,
    YesNoPipe,
  ],
})
export class SyslogCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private translate = inject(TranslateService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];
  protected readonly searchableElements = syslogCardElements;

  protected configOpen = signal(false);
  protected configForm = viewChild(SyslogFormComponent);

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
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  readonly syslogLevelLabels = syslogLevelLabels;

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
