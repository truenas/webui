import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCardComponent,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnIconButtonComponent,
  TnInputComponent,
  TnSlideToggleComponent,
  TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { BehaviorSubject, combineLatest, Observable, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ReportingExporter } from 'app/interfaces/reporting-exporters.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { reportingExportersElements } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-list/reporting-exporters-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-reporting-exporters-list',
  templateUrl: './reporting-exporters-list.component.html',
  styleUrls: ['./reporting-exporters-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnInputComponent,
    FormsModule,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnSlideToggleComponent,
    TnIconButtonComponent,
    TnTablePagerComponent,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class ReportingExporterListComponent implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private slideIn = inject(SlideIn);
  private dialogService = inject(DialogService);
  private emptyService = inject(EmptyService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.ReportingWrite];
  protected readonly searchableElements = reportingExportersElements;
  protected readonly displayedColumns = ['name', 'type', 'enabled', 'actions'];
  protected readonly trackById = (_: number, row: ReportingExporter): number => row.id;

  protected uniqueRowTag(row: ReportingExporter): string {
    return convertStringToId('reporting-exporter-' + row.name);
  }

  protected readonly searchQuery = signal('');
  protected readonly dataProvider = new ArrayDataProvider<ReportingExporter>();
  protected readonly currentPage = toSignal(
    this.dataProvider.currentPage$,
    { initialValue: [] as ReportingExporter[] },
  );

  private exporters: ReportingExporter[] = [];

  private isLoading$ = new BehaviorSubject<boolean>(true);
  private isNoData$ = new BehaviorSubject<boolean>(false);
  private hasError$ = new BehaviorSubject<boolean>(false);

  private emptyType$: Observable<EmptyType> = combineLatest([
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

  protected readonly isLoading = toSignal(this.isLoading$, { initialValue: true });

  private readonly emptyMessage$ = this.emptyType$.pipe(
    map((type) => this.translate.instant(this.emptyService.defaultEmptyConfig(type).title)),
  );

  protected readonly emptyMessage = toSignal(this.emptyMessage$, { initialValue: '' });

  ngOnInit(): void {
    this.getExporters();
  }

  protected doAdd(): void {
    this.slideIn.open(ReportingExportersFormComponent)
      .onSuccess(() => this.getExporters(), this.destroyRef);
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      list: this.exporters,
      query,
      columnKeys: !this.exporters.length ? [] : Object.keys(this.exporters[0]) as (keyof ReportingExporter)[],
    });
    this.cdr.markForCheck();
  }

  protected onToggle(row: ReportingExporter, checked: boolean): void {
    this.loader.open(
      this.translate.instant(
        '{checked} exporter: {name}',
        { name: row.name, checked: checked ? 'Enabling' : 'Disabling' },
      ),
    );
    this.api.call('reporting.exporters.update', [row.id, { enabled: checked }]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      complete: () => {
        this.loader.close();
        this.getExporters();
      },
      error: (error: unknown) => this.errorCaught(error),
    });
  }

  protected onSortChange(event: TnSortEvent): void {
    const direction = event.direction === '' ? null : (event.direction as SortDirection);
    this.dataProvider.setSorting({
      propertyName: direction ? (event.column as keyof ReportingExporter) : null,
      direction,
      active: null,
    });
  }

  protected doEdit(exporter: ReportingExporter): void {
    this.slideIn.open(ReportingExportersFormComponent, { data: exporter })
      .onSuccess(() => this.getExporters(), this.destroyRef);
  }

  protected doDelete(exporter: ReportingExporter): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Delete Reporting Exporter'),
      message: this.translate.instant('Are you sure you want to delete <b>{name}</b> Reporting Exporter?', { name: exporter.name }),
      call: () => this.api.call('reporting.exporters.delete', [exporter.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.getExporters());
  }

  private getExporters(): void {
    this.api.call('reporting.exporters.query').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (exporters: ReportingExporter[]) => {
        this.exporters = exporters;
        this.onListFiltered(this.searchQuery());
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

  private errorCaught(error: unknown): void {
    this.errorHandler.showErrorModal(error);
    this.loader.close();
    this.getExporters();
  }
}
