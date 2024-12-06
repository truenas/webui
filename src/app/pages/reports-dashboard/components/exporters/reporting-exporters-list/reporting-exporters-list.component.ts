import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, filter, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ReportingExporter } from 'app/interfaces/reporting-exporters.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { reportingExportersElements } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-list/reporting-exporters-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-reporting-exporters-list',
  templateUrl: './reporting-exporters-list.component.html',
  styleUrls: ['./reporting-exporters-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ReportingExporterListComponent implements OnInit {
  protected readonly requiredRoles = [Role.ReportingWrite];
  protected readonly searchableElements = reportingExportersElements;

  filterString = '';
  dataProvider = new ArrayDataProvider<ReportingExporter>();

  exporters: ReportingExporter[] = [];
  columns = createTable<ReportingExporter>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'type',
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
        this.api.call('reporting.exporters.update', [row.id, { ...exporter, enabled: checked }]).pipe(
          untilDestroyed(this),
        ).subscribe({
          complete: () => this.appLoader.close(),
          error: (error: unknown) => this.errorCaught(error),
        });
      },
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
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'reporting-exporter-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Reporting Exporter')],
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
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private slideInService: SlideInService,
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
    this.filterString = query;
    this.dataProvider.setFilter({
      list: this.exporters,
      query,
      columnKeys: !this.exporters.length ? [] : Object.keys(this.exporters[0]) as (keyof ReportingExporter)[],
    });
    this.cdr.markForCheck();
  }

  private getExporters(): void {
    this.api.call('reporting.exporters.query').pipe(untilDestroyed(this)).subscribe({
      next: (exporters: ReportingExporter[]) => {
        this.exporters = exporters;
        this.onListFiltered(this.filterString);
        this.isLoading$.next(false);
        this.isNoData$.next(!this.exporters?.length);
        this.setDefaultSort();
        this.cdr.markForCheck();
      },
      error: () => {
        this.exporters = [];
        this.dataProvider.setRows(this.exporters);
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
      switchMap(() => this.api.call('reporting.exporters.delete', [exporter.id])),
      untilDestroyed(this),
    ).subscribe({
      next: (deleted) => {
        if (deleted) {
          this.getExporters();
        }
      },
      complete: () => this.appLoader.close(),
      error: (error: unknown) => this.errorCaught(error),
    });
  }

  private errorCaught(error: unknown): void {
    this.errorHandler.showErrorModal(error);
    this.appLoader.close();
    this.getExporters();
  }
}
