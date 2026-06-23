import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject, viewChild, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderActionsDirective,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnSlideToggleComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
  type TnSortEvent,
  TnDialog,
} from '@truenas/ui-components';
import {
  filter, startWith, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { iscsiCardElements } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.elements';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { DeleteTargetDialog } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { IscsiService } from 'app/services/iscsi.service';
import { LicenseService } from 'app/services/license.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-iscsi-card',
  templateUrl: './iscsi-card.component.html',
  styleUrls: ['./iscsi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    TnCardFooterActionsDirective,
    TnSlideToggleComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    RequiresRolesDirective,
    TestDirective,
    TnIconComponent,
    TnTooltipDirective,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    GlobalTargetConfigurationComponent,
    TableActionsCellComponent,
  ],
})
export class IscsiCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  protected emptyService = inject(EmptyService);
  private store$ = inject<Store<ServicesState>>(Store);
  private tnDialog = inject(TnDialog);
  private iscsiService = inject(IscsiService);
  private license = inject(LicenseService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  protected actionsMenu = inject(ServiceActionsMenuService);

  service$ = this.store$.select(selectService(ServiceName.Iscsi));
  protected service = toSignal(this.service$);
  requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  private hasWriteRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  targets = signal<IscsiTarget[] | null>(null);

  protected readonly hasFibreChannel = toSignal(
    this.license.hasFibreChannel$.pipe(startWith(false)),
  );

  protected readonly searchableElements = iscsiCardElements;
  protected readonly cardMenuPath = ['sharing', 'iscsi'];

  protected serviceStatus = computed(() => this.actionsMenu.buildCardHeaderStatus(this.service()));

  protected headerMenuTriggerTestId = computed(() => this.actionsMenu.cardHeaderMenuTriggerTestId(this.service()));

  protected configOpen = signal(false);
  protected configForm = viewChild(GlobalTargetConfigurationComponent);
  protected closeConfigGuard = this.actionsMenu.buildUnsavedChangesGuard(
    () => this.configForm()?.hasUnsavedChanges() ?? false,
  );

  protected serviceMenu = computed(() => this.actionsMenu.buildServiceCardMenu(
    this.service(),
    this.hasWriteRole(),
    () => this.configOpen.set(true),
  ));

  protected onConfigClosed(): void {
    this.configOpen.set(false);
  }

  dataProvider: AsyncDataProvider<IscsiTarget>;

  protected readonly actions: IconActionConfig<IscsiTarget>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  /**
   * The `mode` column is shown only when at least one target is not a plain
   * iSCSI target (i.e. Fibre Channel is in play) — replacing the legacy
   * `hidden`/effect column mutation with reactive `displayedColumns` membership.
   */
  protected readonly displayedColumns = computed<string[]>(() => {
    const columns = ['name', 'alias'];
    if (this.targets()?.some((target) => target.mode !== IscsiTargetMode.Iscsi)) {
      columns.push('mode');
    }
    columns.push('actions');
    return columns;
  });

  protected readonly trackByIscsiId = (_index: number, row: IscsiTarget): number => row.id;

  protected uniqueRowTag(row: IscsiTarget): string {
    return convertStringToId('card-iscsi-target-' + row.name);
  }

  protected ariaLabel(row: IscsiTarget): string {
    return [row.name, this.translate.instant('iSCSI Target')].join(' ');
  }

  protected getModeValue(row: IscsiTarget): string {
    return this.translate.instant(iscsiTargetModeNames.get(row.mode) || row.mode) || '-';
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<IscsiTarget>(event, this.displayedColumns()));
  }

  ngOnInit(): void {
    const iscsiShares$ = this.api.call('iscsi.target.query').pipe(
      tap((targets) => {
        this.targets.set(targets);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<IscsiTarget>(iscsiShares$);
    this.setDefaultSort();
    this.dataProvider.load();
  }

  openForm(row?: IscsiTarget, openWizard?: boolean): void {
    if (openWizard) {
      this.slideIn.open(IscsiWizardComponent, { data: row, wide: true })
        .onSuccess(() => this.dataProvider.load(), this.destroyRef);
    } else {
      this.slideIn.open(TargetFormComponent, { data: row, wide: true })
        .onSuccess(() => this.dataProvider.load(), this.destroyRef);
    }
  }

  doDelete(iscsi: IscsiTarget): void {
    this.tnDialog
      .open(DeleteTargetDialog, { data: iscsi, width: '600px' })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dataProvider.load());
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }
}
