import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnCellDefDirective, TnEmptyComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, tnIconMarker,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AuthSession, AuthSessionCredentialsData } from 'app/interfaces/auth-session.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { LoaderService } from 'app/modules/loader/loader.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { accessCardElements } from 'app/pages/system/advanced/access/access-card/access-card.elements';
import { getAccessFormConfig } from 'app/pages/system/advanced/access/access-form/access.form-config';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig, waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-access-card',
  styleUrls: ['./access-card.component.scss'],
  templateUrl: './access-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
    IxTablePagerShowMoreComponent,
    TestOverrideDirective,
    TranslateModule,
    YesNoPipe,
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

  protected readonly searchableElements = accessCardElements;
  protected readonly requiredRoles = [Role.AuthSessionsWrite];
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

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
    const sessions$ = this.api.call('auth.sessions', [[['internal', '=', false]]]).pipe(
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

  protected uniqueRowTag(row: AuthSession): string {
    return 'session-' + this.getUsername(row) + '-' + row.origin;
  }

  protected ariaLabel(row: AuthSession): string {
    return [this.getUsername(row), this.translate.instant('Session')].join(' ');
  }

  onConfigure(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.formPanel.openForm(
        getAccessFormConfig(this.api, this.translate, this.store$, () => Boolean(this.isEnterprise())),
        { title: this.translate.instant('Access') },
      ).success$),
      tap(() => {
        this.updateSessions();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
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
