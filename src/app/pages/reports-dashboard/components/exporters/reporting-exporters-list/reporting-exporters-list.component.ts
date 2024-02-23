import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, filter, of, switchMap, tap,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ReportingExporter } from 'app/interfaces/reporting-exporters.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ArrayDataProvider } from 'app/modules/ix-table2/classes/array-data-provider/array-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './reporting-exporters-list.component.html',
  styleUrls: ['./reporting-exporters-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportingExporterListComponent implements OnInit {
  protected readonly requiredRoles = [Role.ReportingWrite];

  filterString = '';
  dataProvider = new ArrayDataProvider<ReportingExporter>();

  exporters: ReportingExporter[] = [];
  columns = createTable<ReportingExporter>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'type',
      sortable: true,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      requiredRoles: this.requiredRoles,
      onRowToggle: (row, checked) => {
        this.appLoader.open(
          this.translate.instant(
            '{checked} exporter: {name}',
            { name: row.name, checked: checked ? 'Enabling' : 'Disabling' },
          ),
        );
        const exporter = { ...row };
        delete exporter.type;
        delete exporter.id;
        this.ws.call('reporting.exporters.update', [row.id, { ...exporter, enabled: checked }]).pipe(
          untilDestroyed(this),
        ).subscribe({
          complete: () => this.appLoader.close(),
          error: (error) => this.errorCaught(error),
        });
      },
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
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'reporting-exporter-' + row.name,
  });

  isLoading$ = new BehaviorSubject<boolean>(true);
  isNoData$ = new BehaviorSubject<boolean>(false);
  hasError$ = new BehaviorSubject<boolean>(false);
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.isNoData$,
    this.hasError$,
  ]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      switch (true) {
        case isLoading:
          return of(EmptyType.Loading);
        case isError:
          return of(EmptyType.Errors);
        case isNoData:
          return of(EmptyType.NoPageData);
        default:
          return of(EmptyType.NoSearchResults);
      }
    }),
  );

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    protected emptyService: EmptyService,
    private appLoader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.getExporters();
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(ReportingExportersFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe({
      next: () => this.getExporters(),
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    const filteredExporters = this.exporters.filter((exporter) => JSON.stringify(exporter).includes(query));
    this.dataProvider.setRows(filteredExporters);
    this.cdr.markForCheck();
  }

  private getExporters(): void {
    this.ws.call('reporting.exporters.query').pipe(untilDestroyed(this)).subscribe({
      next: (exporters: ReportingExporter[]) => {
        this.exporters = exporters;
        this.dataProvider.setRows(this.exporters);
        this.isLoading$.next(false);
        this.isNoData$.next(!this.exporters?.length);
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

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  private doEdit(exporter: ReportingExporter): void {
    const slideInRef = this.slideInService.open(ReportingExportersFormComponent, { data: exporter });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe({
      next: () => this.getExporters(),
    });
  }

  private doDelete(exporter: ReportingExporter): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Reporting Exporter'),
      message: this.translate.instant('Are you sure you want to delete <b>{name}</b> Reporting Exporter?', { name: exporter.name }),
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      tap(() => this.appLoader.open(this.translate.instant('Deleting exporter'))),
      switchMap(() => this.ws.call('reporting.exporters.delete', [exporter.id])),
      untilDestroyed(this),
    ).subscribe({
      next: (deleted) => {
        if (deleted) {
          this.getExporters();
        }
      },
      complete: () => this.appLoader.close(),
      error: (error) => this.errorCaught(error),
    });
  }

  private errorCaught(error: unknown): void {
    this.errorHandler.showErrorModal(error);
    this.appLoader.close();
    this.getExporters();
  }
}
