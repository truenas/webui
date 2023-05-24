import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { filter, map } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { AuthSession, AuthSessionCredentialsData } from 'app/interfaces/auth-session.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppTableAction, AppTableConfig } from 'app/modules/entity/table/table.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

interface AuthSessionRow {
  id: string;
  current: boolean;
  username: string;
  created_at: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-sessions-card',
  styleUrls: ['../../common-card.scss'],
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

  readonly sessionsTableConf: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_sessions_table,
    queryCall: 'auth.sessions',
    queryCallOption: [[['internal', '=', false]]],
    parent: this,
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Username'), prop: 'username' },
      { name: this.translate.instant('Start session time'), prop: 'created_at' },
    ],
    dataSourceHelper: this.sessionsSourceHelper.bind(this),
    getActions: (): AppTableAction<AuthSessionRow>[] => {
      return [
        {
          name: 'terminate',
          icon: 'exit_to_app',
          matTooltip: this.translate.instant('Terminate session'),
          disabledCondition: (row: AuthSessionRow): boolean => {
            return row.current;
          },
          onClick: (row: AuthSessionRow): void => {
            this.dialogService
              .confirm({
                title: this.translate.instant('Terminate session'),
                message: this.translate.instant('Are you sure you want to terminate the session?'),
              })
              .pipe(
                filter(Boolean),
                untilDestroyed(this),
              ).subscribe({
                next: () => this.terminateSession(row.id),
                error: (err: WebsocketError) => this.dialogService.error(this.errorHandler.parseWsError(err)),
              });
          },
        },
      ];
    },
    tableFooterActions: [
      {
        label: this.translate.instant('Terminate Other Sessions'),
        onClick: () => {
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
        },
      },
    ],
  };

  constructor(
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const slideInRef = this.slideInService.open(TokenSettingsComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.sessionsTableConf.tableComponent?.getData();
    });
  }

  terminateOtherSessions(): void {
    this.loader.open();
    this.ws.call('auth.terminate_other_sessions').pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.sessionsTableConf.tableComponent.getData();
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  private sessionsSourceHelper(data: AuthSession[]): AuthSessionRow[] {
    return data.map((session) => {
      return {
        id: session.id,
        current: session.current,
        username: this.getUsername(session),
        created_at: format(session.created_at.$date, 'Pp'),
      };
    });
  }

  private getUsername(credentialsData: AuthSessionCredentialsData): string {
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
        this.sessionsTableConf.tableComponent.getData();
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }
}
