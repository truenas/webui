import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap,
} from 'rxjs';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { StaticRouteDeleteDialogComponent } from 'app/pages/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-static-routes',
  templateUrl: './static-routes-card.component.html',
  styleUrls: ['./static-routes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticRoutesCardComponent implements OnInit {
  filterString = '';
  dataProvider: AsyncDataProvider<StaticRoute>;
  staticRoutes: StaticRoute[] = [];
  columns = createTable<StaticRoute>([
    textColumn({
      title: this.translate.instant('Destination'),
      propertyName: 'destination',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Gateway'),
      propertyName: 'gateway',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ]);

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const staticRoutes$ = this.ws.call('staticroute.query').pipe(
      tap((staticRoutes) => this.staticRoutes = staticRoutes),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<StaticRoute>(staticRoutes$);
    this.setDefaultSort();
  }

  getStaticRoutes(): void {
    this.dataProvider.refresh();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'destination',
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(StaticRouteFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getStaticRoutes();
    });
  }

  doEdit(route: StaticRoute): void {
    const slideInRef = this.slideInService.open(StaticRouteFormComponent, { data: route });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getStaticRoutes();
    });
  }

  doDelete(route: StaticRoute): void {
    this.matDialog.open(StaticRouteDeleteDialogComponent, {
      data: route,
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getStaticRoutes();
      });
  }
}
