import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
  tnIconMarker,
} from '@truenas/ui-components';
import { formatDuration } from 'date-fns';
import { of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { secondsToDuration } from 'app/helpers/time.helpers';
import { AuthSession, AuthSessionCredentialsData, toAuthSession } from 'app/interfaces/auth-session.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { PreferencesFormComponent } from 'app/modules/layout/topbar/user-menu/preferences-form/preferences-form.component';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SplitTagPipe } from 'app/modules/pipes/split-tag/split-tag.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { TablePagerShowMoreComponent } from 'app/modules/tn-table/components/table-pager-show-more/table-pager-show-more.component';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { accessCardElements } from 'app/pages/system/advanced/access/access-card/access-card.elements';
import { getAccessFormConfig } from 'app/pages/system/advanced/access/access-form/access.form-config';
import { EntitlementsService } from 'app/services/entitlements.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForAdvancedConfig, waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-access-card',
  styleUrls: ['./access-card.component.scss'],
  templateUrl: './access-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    TableTextCellComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    WithLoadingStateDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    IxDateComponent,
    TablePagerShowMoreComponent,
    TranslateModule,
    YesNoPipe,
    SplitTagPipe,
    AsyncPipe,
  ],
})
export class AccessCardComponent implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private formPanel = inject(FormSidePanelService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);
  private entitlements = inject(EntitlementsService);
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  protected readonly searchableElements = accessCardElements;
  protected readonly requiredRoles = [Role.AuthSessionsWrite];
  // One sentence for translators; `splitTag` renders the <link> part as the Preferences button.
  protected readonly changeTimeoutHint = T('Change Session Timeout in <link>Preferences</link>');
  protected readonly hasDirectoryServices = this.entitlements.entitled(EntitlementFeature.DirectoryServicesAuth);

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    map((generalConfig) => generalConfig.ds_auth),
    toLoadingState(),
  );

  readonly sessionTimeout$ = this.store$.pipe(
    waitForPreferences,
    map((preferences) => formatDuration(secondsToDuration(preferences.lifetime || defaultPreferences.lifetime))),
    toLoadingState(),
  );

  readonly loginBanner$ = this.store$.pipe(
    waitForAdvancedConfig,
    map((advancedConfig) => advancedConfig.login_banner),
    toLoadingState(),
  );

  dataProvider: AsyncDataProvider<AuthSession>;

  protected readonly displayedColumns = ['username', 'created_at', 'actions'];
  protected readonly trackBy = (_: number, row: AuthSession): string => row.id;

  protected readonly actions: IconActionConfig<AuthSession>[] = [
    {
      iconName: tnIconMarker('exit-to-app', 'mdi'),
      dynamicTooltip: (row) => of(row.current
        ? this.translate.instant('This session is current and cannot be terminated')
        : this.translate.instant('Terminate session')),
      onClick: (row) => this.onTerminate(row.id),
      disabled: (row) => of(row.current),
      requiredRoles: this.requiredRoles,
    },
  ];

  ngOnInit(): void {
    const sessions$ = this.api.query('auth.sessions', [['internal', '=', false]]).pipe(
      map((sessions) => sessions.map(toAuthSession)),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<AuthSession>(sessions$);
    this.updateSessions();
  }

  private updateSessions(): void {
    this.dataProvider.load();
  }

  protected getUsername(row: AuthSessionCredentialsData | undefined): string {
    if (row?.credentials_data) {
      return row.credentials_data.username || this.getUsername(row.credentials_data.parent);
    }
    return '';
  }

  protected readonly uniqueRowTag = (row: AuthSession): string => (
    'session-' + this.getUsername(row) + '-' + row.origin
  );

  protected ariaLabel(row: AuthSession): string {
    return [this.getUsername(row), this.translate.instant('Session')].join(' ');
  }

  onConfigure(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.formPanel.openForm(
        getAccessFormConfig(this.api, this.translate, this.store$, () => Boolean(this.hasDirectoryServices())),
        { title: this.translate.instant('Access') },
      ).success$),
      tap(() => {
        this.updateSessions();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected openPreferences(): void {
    this.formPanel.open(PreferencesFormComponent, { title: this.translate.instant('Preferences') });
    // Wait a frame for the side panel to render before polling for the element.
    setTimeout(() => this.navigateAndHighlight.waitForElement('session-timeout'));
  }

  private onTerminate(id: string): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Terminate session'),
        message: this.translate.instant('Are you sure you want to terminate the session?'),
      })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => this.terminateSession(id),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
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
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => this.terminateOtherSessions(),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }

  private terminateOtherSessions(): void {
    this.api.call('auth.terminate_other_sessions').pipe(
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.updateSessions();
    });
  }

  private terminateSession(sessionId: string): void {
    this.api.call('auth.terminate_session', [sessionId]).pipe(
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.updateSessions();
    });
  }
}
