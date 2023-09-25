import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, switchMap, of, filter,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
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
  dataProvider = new ArrayDataProvider<StaticRoute>();
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
    textColumn({
      propertyName: 'id',
    }),
  ]);

  isLoading$ = new BehaviorSubject<boolean>(true);
  isNoData$ = new BehaviorSubject<boolean>(false);
  hasError$ = new BehaviorSubject<boolean>(false);
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.isNoData$,
    this.hasError$,
  ]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.getStaticRoutes();
  }

  getStaticRoutes(): void {
    this.ws.call('staticroute.query').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (staticRoutes) => {
        this.staticRoutes = staticRoutes;
        this.dataProvider.setRows(this.staticRoutes);
        this.isLoading$.next(false);
        this.isNoData$.next(!this.staticRoutes.length);
        this.setDefaultSort();
        this.cdr.markForCheck();
      },
      error: () => {
        this.dataProvider.setRows([]);
        this.isLoading$.next(false);
        this.hasError$.next(true);
        this.cdr.markForCheck();
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.staticRoutes.filter((route) => [
      route.destination.toLowerCase(),
      route.gateway.toLowerCase(),
    ].includes(this.filterString)));
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
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getStaticRoutes();
    });
  }

  doEdit(route: StaticRoute): void {
    const slideInRef = this.slideInService.open(StaticRouteFormComponent, { data: route });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
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
