import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { filter, map } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { AuthSession, AuthSessionCredentialsData } from 'app/interfaces/auth-session.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-sessions-card',
  styleUrls: ['../../common-card.scss', './sessions-card.component.scss'],
  templateUrl: './sessions-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsCardComponent {
  readonly tokenLifetime$ = this.store$.pipe(
    waitForPreferences,
    map((preferences) => {
      return preferences.lifetime ? preferences.lifetime : defaultPreferences.lifetime;
    }),
    toLoadingState(),
  );

  isLoading = false;
  dataProvider = new ArrayDataProvider<AuthSession>();

  columns: TableColumn<AuthSession>[] = [
    {
      title: this.translate.instant('Username'),
      propertyName: 'credentials_data',
    },
    {
      title: this.translate.instant('Start session time'),
      propertyName: 'created_at',
    },
    {
      propertyName: 'id',
    },
  ];

  constructor(
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private advancedSettings: AdvancedSettingsService,
    private cdr: ChangeDetectorRef,
  ) {
    this.updateSessions();
  }

  updateSessions(): void {
    this.isLoading = true;
    this.ws.call('auth.sessions', [[['internal', '=', false]]]).pipe(
      untilDestroyed(this),
    ).subscribe((sessions) => {
      this.dataProvider.setRows(sessions);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const slideInRef = this.slideInService.open(TokenSettingsComponent);
    slideInRef?.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
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
    this.loader.open();
    this.ws.call('auth.terminate_other_sessions').pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.updateSessions();
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  asDuration(tokenLifetime: number): string {
    const duration = intervalToDuration({ start: 0, end: tokenLifetime * 1000 });
    return formatDuration(duration, {
      format: ['hours', 'minutes', 'seconds'],
    });
  }

  getDate(date: number): string {
    return format(date, 'Pp');
  }

  getUsername(credentialsData: AuthSessionCredentialsData): string {
    if (credentialsData && credentialsData.credentials_data) {
      return credentialsData.credentials_data.username || this.getUsername(credentialsData.credentials_data.parent);
    }
    return '';
  }

  private terminateSession(sessionId: string): void {
    this.loader.open();
    this.ws.call('auth.terminate_session', [sessionId]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.updateSessions();
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }
}
