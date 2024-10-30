import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  StaticRouteDeleteDialogComponent,
} from 'app/pages/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { staticRoutesCardElements } from 'app/pages/network/components/static-routes-card/static-routes-card.elements';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-static-routes',
  templateUrl: './static-routes-card.component.html',
  styleUrls: ['./static-routes-card.component.scss'],
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
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class StaticRoutesCardComponent implements OnInit {
  protected readonly searchableElements = staticRoutesCardElements.elements;
  readonly requiredRoles = [Role.FullAdmin];

  dataProvider: AsyncDataProvider<StaticRoute>;
  staticRoutes: StaticRoute[] = [];
  columns = createTable<StaticRoute>([
    textColumn({
      title: this.translate.instant('Destination'),
      propertyName: 'destination',
    }),
    textColumn({
      title: this.translate.instant('Gateway'),
      propertyName: 'gateway',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'static-route-' + row.destination + '-' + row.gateway,
    ariaLabels: (row) => [row.description, this.translate.instant('Static Route')],
  });

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private slideInService: SlideInService,
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
    this.getStaticRoutes();
  }

  getStaticRoutes(): void {
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
