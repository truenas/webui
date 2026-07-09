import { ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnCardHeaderDirective,
  TnCellDefDirective, TnDialog, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  tnIconMarker, type TnSortEvent,
} from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import {
  convertStringToId, dataProviderLoading, dataProviderRows, mapTnSortToTableSort,
} from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  StaticRouteDeleteDialog,
} from 'app/pages/system/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { getStaticRouteFormConfig } from 'app/pages/system/network/components/static-route-form/static-route.form-config';
import { staticRoutesCardElements } from 'app/pages/system/network/components/static-routes-card/static-routes-card.elements';

@Component({
  selector: 'ix-static-routes',
  templateUrl: './static-routes-card.component.html',
  styleUrls: ['./static-routes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardFooterActionsDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
    UiSearchDirective,
    RequiresRolesDirective,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    TooltipComponent,
  ],
})
export class StaticRoutesCardComponent implements OnInit {
  private tnDialog = inject(TnDialog);
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = staticRoutesCardElements.elements;
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  private readonly staticRoutes$ = this.api.call('staticroute.query').pipe(
    takeUntilDestroyed(this.destroyRef),
  );

  dataProvider = new AsyncDataProvider<StaticRoute>(this.staticRoutes$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly displayedColumns = ['destination', 'gateway', 'actions'];

  private readonly emptyType = toSignal(this.dataProvider.emptyType$);

  // Keep the page-specific message for the no-records case, but surface the API
  // error state distinctly instead of masking it as "No static routes configured".
  protected readonly emptyMessage = computed(() => {
    return this.emptyType() === EmptyType.Errors
      ? this.translate.instant(this.emptyService.defaultEmptyConfig(EmptyType.Errors).title)
      : this.translate.instant('No static routes configured');
  });

  protected readonly emptyIcon = computed(() => this.emptyService.iconForTypeOrDefault(this.emptyType(), ''));

  protected readonly actions: IconActionConfig<StaticRoute>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => this.doDelete(row),
    },
  ];

  protected uniqueRowTag(row: StaticRoute): string {
    return convertStringToId('static-route-' + row.destination + '-' + row.gateway);
  }

  protected ariaLabel(row: StaticRoute): string {
    return [row.description, this.translate.instant('Static Route')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<StaticRoute>(event, this.displayedColumns));
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.getStaticRoutes();
  }

  private getStaticRoutes(): void {
    this.dataProvider.load();
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'destination',
    });
  }

  protected doAdd(): void {
    this.formPanel.openForm(getStaticRouteFormConfig(this.api, this.translate, undefined), {
      title: this.translate.instant('Add Static Route'),
    }).onSuccess(() => this.getStaticRoutes(), this.destroyRef);
  }

  private doEdit(route: StaticRoute): void {
    this.formPanel.openForm(getStaticRouteFormConfig(this.api, this.translate, route), {
      title: this.translate.instant('Edit Static Route'),
      editData: route,
    }).onSuccess(() => this.getStaticRoutes(), this.destroyRef);
  }

  private doDelete(route: StaticRoute): void {
    this.tnDialog.open(StaticRouteDeleteDialog, {
      data: route,
    }).closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getStaticRoutes();
      });
  }
}
