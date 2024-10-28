import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { formatDuration, intervalToDuration } from 'date-fns';
import { of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AuthSession, AuthSessionCredentialsData } from 'app/interfaces/auth-session.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { accessCardElements } from 'app/pages/system/advanced/access/access-card/access-card.elements';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TestOverrideDirective,
    TranslateModule,
    YesNoPipe,
    AsyncPipe,
  ],
})
export class AccessCardComponent implements OnInit {
  protected readonly searchableElements = accessCardElements;
  readonly requiredRoles = [Role.AuthSessionsWrite];
  readonly sessionTimeout$ = this.store$.pipe(
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
          iconName: iconMarker('exit_to_app'),
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
    uniqueRowTag: (row) => 'session-' + this.getUsername(row) + '-' + row.origin,
    ariaLabels: (row) => [this.getUsername(row), this.translate.instant('Session')],
  });

  get isEnterprise(): boolean {
    return this.systemGeneralService.isEnterprise;
  }

  constructor(
    private store$: Store<AppState>,
    private chainedSlideIn: ChainedSlideInService,
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

  asDuration(sessionTimeout: number): string {
    const duration = intervalToDuration({ start: 0, end: sessionTimeout * 1000 });
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
