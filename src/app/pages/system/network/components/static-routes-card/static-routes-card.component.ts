import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderDirective,
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  tnIconMarker, type TnSortEvent,
} from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import {
  convertStringToId, dataProviderLoading, dataProviderRows, mapTnSortToTableSort,
} from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ShareActionsCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-actions-cell/share-actions-cell.component';
import {
  StaticRouteDeleteDialog,
} from 'app/pages/system/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { StaticRouteFormComponent } from 'app/pages/system/network/components/static-route-form/static-route-form.component';
import { staticRoutesCardElements } from 'app/pages/system/network/components/static-routes-card/static-routes-card.elements';

@Component({
  selector: 'ix-static-routes',
  templateUrl: './static-routes-card.component.html',
  styleUrls: ['./static-routes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    ShareActionsCellComponent,
    UiSearchDirective,
    RequiresRolesDirective,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    TooltipComponent,
  ],
})
export class StaticRoutesCardComponent implements OnInit {
  private matDialog = inject(MatDialog);
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
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

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'destination',
    });
  }

  doAdd(): void {
    this.slideIn.open(StaticRouteFormComponent).onSuccess(() => this.getStaticRoutes(), this.destroyRef);
  }

  doEdit(route: StaticRoute): void {
    this.slideIn.open(StaticRouteFormComponent, { data: route })
      .onSuccess(() => this.getStaticRoutes(), this.destroyRef);
  }

  doDelete(route: StaticRoute): void {
    this.matDialog.open(StaticRouteDeleteDialog, {
      data: route,
    }).afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getStaticRoutes();
      });
  }
}
