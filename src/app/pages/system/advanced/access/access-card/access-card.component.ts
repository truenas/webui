import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { formatDuration, intervalToDuration } from 'date-fns';
import { of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AuthSession, AuthSessionCredentialsData } from 'app/interfaces/auth-session.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { accessCardElements } from 'app/pages/system/advanced/access/access-card/access-card.elements';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForAdvancedConfig, waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-access-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './access-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessCardComponent implements OnInit {
  protected readonly searchableElements = accessCardElements;
  readonly requiredRoles = [Role.AuthSessionsWrite];
  readonly tokenLifetime$ = this.store$.pipe(
    waitForPreferences,
    map((preferences) => {
      return preferences.lifetime ? preferences.lifetime : defaultPreferences.lifetime;
    }),
    toLoadingState(),
  );

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    map((generalConfig) => generalConfig.ds_auth),
    toLoadingState(),
  );

  readonly loginBanner$ = this.store$.pipe(
    waitForAdvancedConfig,
    map((advancedConfig) => advancedConfig.login_banner),
    toLoadingState(),
  );

  dataProvider: AsyncDataProvider<AuthSession>;

  columns = createTable<AuthSession>([
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'credentials_data',
      getValue: (row) => this.getUsername(row),
    }),
    dateColumn({
      title: this.translate.instant('Start session time'),
      propertyName: 'created_at',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'exit_to_app',
          dynamicTooltip: (row) => of(row.current
            ? this.translate.instant('This session is current and cannot be terminated')
            : this.translate.instant('Terminate session')),
          onClick: (row) => this.onTerminate(row.id),
          disabled: (row) => of(row.current),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'session-' + this.getUsername(row) + '-' + row.origin,
    ariaLabels: (row) => [this.getUsername(row), this.translate.instant('Session')],
  });

  get isEnterprise(): boolean {
    return this.systemGeneralService.isEnterprise;
  }

  constructor(
    private store$: Store<AppState>,
    private chainedSlideIn: IxChainedSlideInService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private advancedSettings: AdvancedSettingsService,
    private systemGeneralService: SystemGeneralService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const sessions$ = this.ws.call('auth.sessions', [[['internal', '=', false]]]).pipe(
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<AuthSession>(sessions$);
    this.updateSessions();
  }

  updateSessions(): void {
    this.dataProvider.load();
  }

  onConfigure(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIn.open(AccessFormComponent)),
      filter((response) => !!response.response),
      tap(() => {
        this.updateSessions();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onTerminate(id: string): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Terminate session'),
        message: this.translate.instant('Are you sure you want to terminate the session?'),
      })
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe({
        next: () => this.terminateSession(id),
        error: (err: unknown) => this.dialogService.error(this.errorHandler.parseError(err)),
      });
  }

  onTerminateOther(): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Terminate session'),
        message: this.translate.instant('Are you sure you want to terminate all other sessions?'),
      })
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe({
        next: () => this.terminateOtherSessions(),
        error: (error: unknown) => this.dialogService.error(this.errorHandler.parseError(error)),
      });
  }

  private terminateOtherSessions(): void {
    this.ws.call('auth.terminate_other_sessions').pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.updateSessions();
    });
  }

  asDuration(tokenLifetime: number): string {
    const duration = intervalToDuration({ start: 0, end: tokenLifetime * 1000 });
    return formatDuration(duration, {
      format: ['days', 'hours', 'minutes', 'seconds'],
    });
  }

  getUsername(credentialsData: AuthSessionCredentialsData): string {
    if (credentialsData?.credentials_data) {
      return credentialsData.credentials_data.username || this.getUsername(credentialsData.credentials_data.parent);
    }
    return '';
  }

  private terminateSession(sessionId: string): void {
    this.ws.call('auth.terminate_session', [sessionId]).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.updateSessions();
    });
  }
}
