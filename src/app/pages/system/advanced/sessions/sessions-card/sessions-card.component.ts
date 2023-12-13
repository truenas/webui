import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { formatDuration, intervalToDuration } from 'date-fns';
import { of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AuthSession, AuthSessionCredentialsData } from 'app/interfaces/auth-session.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { dateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-sessions-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './sessions-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsCardComponent implements OnInit {
  readonly tokenLifetime$ = this.store$.pipe(
    waitForPreferences,
    map((preferences) => {
      return preferences.lifetime ? preferences.lifetime : defaultPreferences.lifetime;
    }),
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
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'session-' + row.id.toString(),
  });

  constructor(
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private advancedSettings: AdvancedSettingsService,
    protected emptyService: EmptyService,
    private cdr: ChangeDetectorRef,
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

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const slideInRef = this.slideInService.open(TokenSettingsComponent);
    slideInRef?.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.updateSessions();
    });
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
        error: (err: WebsocketError) => this.dialogService.error(this.errorHandler.parseWsError(err)),
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
        error: (error: WebsocketError) => this.dialogService.error(this.errorHandler.parseWsError(error)),
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
      format: ['hours', 'minutes', 'seconds'],
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
