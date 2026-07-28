import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import {
  BehaviorSubject, Observable, combineLatest, of,
} from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { checkboxColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { sizeColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TableFilter } from 'app/modules/ix-table/interfaces/table-filter.interface';
import { createTable } from 'app/modules/ix-table/utils';
import { getMachineTime, LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SnapshotBatchDeleteDialog } from 'app/pages/datasets/modules/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { SnapshotDetailsRowComponent } from 'app/pages/datasets/modules/snapshots/snapshot-details-row/snapshot-details-row.component';
import { snapshotListElements } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.elements';
import { snapshotPageEntered, snapshotsLoaded } from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { selectSnapshotState, selectSnapshots, selectSnapshotsTotal } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { getFiniteNumber, getSnapshotCreationMs } from 'app/pages/datasets/modules/snapshots/utils/snapshot-creation.utils';
import { AppState } from 'app/store';
import { snapshotExtraColumnsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

// TODO: Exclude AnythingUi when NAS-127632 is done
export interface ZfsSnapshotUi extends ZfsSnapshot {
  selected: boolean;
}

@Component({
  selector: 'ix-snapshot-list',
  templateUrl: './snapshot-list.component.html',
  styleUrls: ['./snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // FileSizePipe / FormatDateTimePipe are injected (not only used in the template)
  // so the search filter can render the extra columns' values into the same strings
  // the cells display. See buildSearchFilter.
  providers: [FileSizePipe, FormatDateTimePipe],
  imports: [
    PageHeaderComponent,
    MatProgressSpinner,
    ReactiveFormsModule,
    IxSlideToggleComponent,
    TranslateModule,
    BasicSearchComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    AsyncPipe,
    MatTooltip,
    IxTableEmptyDirective,
    TnIconComponent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    SnapshotDetailsRowComponent,
    IxTablePagerComponent,
    UiSearchDirective,
  ],
})
export class SnapshotListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private actions$ = inject(Actions);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private matDialog = inject(MatDialog);
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private fileSize = inject(FileSizePipe);
  private formatDateTime = inject(FormatDateTimePipe);
  private localeService = inject(LocaleService);

  protected readonly requiredRoles = [Role.SnapshotDelete];
  searchQuery = signal('');
  dataProvider = new ArrayDataProvider<ZfsSnapshotUi>();
  snapshots: ZfsSnapshotUi[] = [];
  showExtraColumnsControl = new FormControl<boolean>(false);
  loadingExtraColumns$ = new BehaviorSubject(true);
  isLoading$ = combineLatest([
    this.store$.select(selectSnapshotState).pipe(map((state) => state.isLoading)),
    this.loadingExtraColumns$,
  ]).pipe(map(([isLoading, loadingExtraColumns]) => isLoading || loadingExtraColumns));

  protected readonly searchableElements = snapshotListElements;

  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.store$.select(selectSnapshotsTotal).pipe(map((total) => total === 0)),
    this.store$.select(selectSnapshotState).pipe(map((state) => state.error)),
  ]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      switch (true) {
        case isLoading:
          return of(EmptyType.Loading);
        case !!isError:
          return of(EmptyType.Errors);
        case isNoData:
          return of(EmptyType.NoPageData);
        default:
          return of(EmptyType.NoSearchResults);
      }
    }),
  );

  columns = createTable<ZfsSnapshotUi>([
    checkboxColumn({
      propertyName: 'selected',
      onRowCheck: (row, checked) => {
        const snapshotToSelect = this.snapshots.find((snapshot) => row.name === snapshot.name);
        if (snapshotToSelect) {
          snapshotToSelect.selected = checked;
        }
        this.dataProvider.setRows([]);
        this.onListFiltered(this.searchQuery());
      },
      onColumnCheck: (checked) => {
        this.dataProvider.currentPage$.pipe(
          take(1),
          takeUntilDestroyed(this.destroyRef),
        ).subscribe((snapshots) => {
          snapshots.forEach((snapshot) => snapshot.selected = checked);
          this.dataProvider.setRows([]);
          this.onListFiltered(this.searchQuery());
        });
      },
      cssClass: 'checkboxs-column',
    }),
    textColumn({
      title: this.translate.instant('Dataset'),
      propertyName: 'dataset',
    }),
    textColumn({
      title: this.translate.instant('Snapshot'),
      propertyName: 'snapshot_name',
    }),
    sizeColumn({
      title: this.translate.instant('Used'),
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => getFiniteNumber(row?.properties?.used?.parsed),
    }),
    dateColumn({
      title: this.translate.instant('Date created'),
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => getSnapshotCreationMs(row),
    }),
    sizeColumn({
      title: this.translate.instant('Referenced'),
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => getFiniteNumber(row?.properties?.referenced?.parsed),
    }),
  ], {
    uniqueRowTag: (row) => 'snapshot-' + row.id,
    ariaLabels: (row) => [row.name, this.translate.instant('Snapshot')],
  });

  get pageTitle(): string {
    if (this.searchQuery().length) {
      return this.translate.instant('Snapshots') + ': ' + this.searchQuery();
    }
    return this.translate.instant('Snapshots');
  }

  get selectedSnapshots(): ZfsSnapshotUi[] {
    return this.snapshots.filter((snapshot) => snapshot.selected);
  }

  get selectionHasItems(): boolean {
    return this.selectedSnapshots.some((snapshot) => snapshot.selected);
  }

  constructor() {
    this.searchQuery.set(this.route.snapshot.paramMap.get('dataset') || '');
  }

  ngOnInit(): void {
    this.getPreferences();
    this.getSnapshots();
    this.setDefaultSort();
    this.listenForShowExtraColumnsChange();
  }

  private listenForShowExtraColumnsChange(): void {
    this.showExtraColumnsControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.toggleExtraColumns());
  }

  private updateColumnVisibility(): void {
    this.columns = this.columns.map((column) => {
      if (column.hasOwnProperty('hidden')) {
        column.hidden = !this.showExtraColumnsControl.value;
      }
      return column;
    });
    this.cdr.markForCheck();
  }

  getSnapshots(): void {
    this.store$.select(selectSnapshots).pipe(
      map((snapshots) => {
        this.snapshots = snapshots.map((snapshot) => ({
          ...snapshot,
          selected: false,
        }));
        return this.snapshots;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.onListFiltered(this.searchQuery());
      this.cdr.markForCheck();
    });
  }

  getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      map((preferences) => preferences.showSnapshotExtraColumns),
      take(1),
    ).subscribe((showExtraColumns) => {
      this.showExtraColumnsControl.setValue(showExtraColumns, { emitEvent: false });
      this.updateColumnVisibility();
      this.store$.dispatch(snapshotPageEntered());
      this.loadingExtraColumns$.next(false);
    });
  }

  private getConfirmOptions(): ConfirmOptions {
    if (!this.showExtraColumnsControl.value) {
      return {
        title: this.translate.instant(helptextSnapshots.extraColumns.hide),
        message: this.translate.instant(helptextSnapshots.extraColumns.hideMessage),
        buttonText: this.translate.instant(helptextSnapshots.extraColumns.hideButton),
        hideCheckbox: true,
      };
    }

    return {
      title: this.translate.instant(helptextSnapshots.extraColumns.show),
      message: this.translate.instant(helptextSnapshots.extraColumns.showMessage),
      buttonText: this.translate.instant(helptextSnapshots.extraColumns.showButton),
      hideCheckbox: true,
    };
  }

  private toggleExtraColumns(): void {
    this.dialogService.confirm(this.getConfirmOptions())
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.loadingExtraColumns$.next(true);
          this.updateColumnVisibility();
          this.store$.dispatch(snapshotExtraColumnsToggled());
          this.store$.dispatch(snapshotPageEntered());

          this.actions$.pipe(
            ofType(snapshotsLoaded),
            take(1),
            takeUntilDestroyed(this.destroyRef),
          ).subscribe(() => {
            this.loadingExtraColumns$.next(false);
          });
        } else {
          this.showExtraColumnsControl.setValue(!this.showExtraColumnsControl.value, { emitEvent: false });
        }
      });
  }

  doAdd(): void {
    this.slideIn.open(SnapshotAddFormComponent);
  }

  doBatchDelete(data: ZfsSnapshotUi[]): void {
    this.matDialog.open(SnapshotBatchDeleteDialog, { data, disableClose: true })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.selectedSnapshots.forEach((snapshot) => snapshot.selected = false);
        this.cdr.markForCheck();
      });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    const datasetParam = this.route.snapshot.paramMap.get('dataset');

    if (datasetParam && query === datasetParam) {
      this.dataProvider.setFilter({
        list: this.snapshots,
        query,
        columnKeys: ['dataset'],
        exact: true,
      });

      if (this.dataProvider.totalRows === 0) {
        this.dataProvider.setFilter(this.buildSearchFilter(query));
      }
    } else {
      this.dataProvider.setFilter(this.buildSearchFilter(query));
    }
  }

  /**
   * `name` carries both the dataset and the snapshot name, so it covers the two
   * default columns. When the extra columns are visible the search should also
   * match what those cells show — `used`, `referenced` and `created` are
   * display-only columns backed by nested `properties` fields, so we point
   * `filterTableRows` at those dot-paths (resolved via lodash `get`) and format
   * each raw value into the exact string the cell renders via the preprocessMap.
   * The casts are nominal: the paths aren't literal `ZfsSnapshotUi` keys.
   */
  private buildSearchFilter(query: string): TableFilter<ZfsSnapshotUi> {
    if (!this.showExtraColumnsControl.value) {
      return { list: this.snapshots, query, columnKeys: ['name'] };
    }

    const usedPath = 'properties.used.parsed';
    const referencedPath = 'properties.referenced.parsed';
    const createdPath = 'properties.creation.parsed';

    const preprocessMap = {
      [usedPath]: (value: unknown) => this.formatSize(value),
      [referencedPath]: (value: unknown) => this.formatSize(value),
      [createdPath]: (value: unknown) => this.formatCreated(value),
    } as TableFilter<ZfsSnapshotUi>['preprocessMap'];

    return {
      list: this.snapshots,
      query,
      columnKeys: ['name', usedPath, referencedPath, createdPath] as (keyof ZfsSnapshotUi)[],
      preprocessMap,
    };
  }

  private formatSize(value: unknown): string {
    const bytes = getFiniteNumber(value);
    return bytes === undefined ? '' : this.fileSize.transform(bytes);
  }

  private formatCreated(value: unknown): string {
    // `creation.parsed` is unix-seconds (see getSnapshotCreationMs). Mirror <ix-date>:
    // convert to the machine timezone, then format with the same locale-aware pipe the
    // cell uses so a search matches the on-screen date/time.
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return '';
    }
    const machineTime = getMachineTime(value * 1000, this.localeService.timezone);
    return this.formatDateTime.transform(machineTime);
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Desc,
      propertyName: 'name',
    });
  }
}
