import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnInit,
  computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnTooltipDirective, TnDialog, TnButtonComponent, TnSlideToggleComponent, TnSpinnerComponent,
  TnEmptyComponent, TnTableComponent, TnTableColumnDirective, TnHeaderCellDefDirective,
  TnCellDefDirective, TnDetailRowDefDirective, TnTablePagerComponent, TnSortEvent,
} from '@truenas/ui-components';
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
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { getMachineTime, LocaleService } from 'app/modules/language/locale.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ArrayDataProvider } from 'app/modules/tn-table/classes/array-data-provider/array-data-provider';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';
import { TableFilter } from 'app/modules/tn-table/interfaces/table-filter.interface';
import { mapTnSortToTableSort } from 'app/modules/tn-table/utils';
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
    TnSpinnerComponent,
    TnSlideToggleComponent,
    TranslateModule,
    ReactiveFormsModule,
    BasicSearchComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TnTooltipDirective,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    SnapshotDetailsRowComponent,
    TnTablePagerComponent,
    UiSearchDirective,
    FileSizePipe,
    IxDateComponent,
  ],
})
export class SnapshotListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private actions$ = inject(Actions);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private tnDialog = inject(TnDialog);
  private store$ = inject<Store<AppState>>(Store);
  private formPanel = inject(FormSidePanelService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private fileSize = inject(FileSizePipe);
  private formatDateTime = inject(FormatDateTimePipe);
  private localeService = inject(LocaleService);

  protected readonly requiredRoles = [Role.SnapshotDelete];
  searchQuery = signal('');
  dataProvider = new ArrayDataProvider<ZfsSnapshot>();
  /**
   * Written only by `setSnapshots`, which keeps `snapshotNames` and the selection in step
   * with it. Private so the compiler enforces that rather than a comment — a second write
   * site would leave the name index stale, and the selection prune trusts that index.
   */
  private snapshots: ZfsSnapshot[] = [];
  /**
   * The names in `snapshots`, so a selection can be pruned in constant time per selected
   * row — a dataset can hold tens of thousands of snapshots, and `onSelectionChange` runs
   * on every tick of a checkbox. Rebuilt with `snapshots` in `setSnapshots`.
   */
  private snapshotNames = new Set<string>();
  protected readonly showExtraColumns = signal(false);
  // Drives the slide toggle through a ControlValueAccessor rather than a plain
  // `[checked]` binding: tn-slide-toggle latches its own visual state internally,
  // so only writing the control value back (`writeValue`) can snap the switch to a
  // prior position when the user cancels the confirmation. See onToggleExtraColumns.
  protected readonly showExtraColumnsControl = new FormControl(false, { nonNullable: true });
  loadingExtraColumns$ = new BehaviorSubject(true);
  protected readonly loadingExtraColumns = toSignal(this.loadingExtraColumns$, { initialValue: true });
  isLoading$ = combineLatest([
    this.store$.select(selectSnapshotState).pipe(map((state) => state.isLoading)),
    this.loadingExtraColumns$,
  ]).pipe(map(([isLoading, loadingExtraColumns]) => isLoading || loadingExtraColumns));

  protected readonly isLoading = toSignal(this.isLoading$, { initialValue: true });
  protected readonly searchableElements = snapshotListElements;

  private readonly table = viewChild(TnTableComponent<ZfsSnapshot>);
  protected readonly currentPage = toSignal(this.dataProvider.currentPage$, { initialValue: [] as ZfsSnapshot[] });
  protected readonly currentPageCount = toSignal(this.dataProvider.currentPageCount$, { initialValue: 0 });

  protected readonly selectedSnapshots = signal<ZfsSnapshot[]>([]);

  protected readonly displayedColumns = computed(() => {
    const base = ['dataset', 'snapshot_name'];
    return this.showExtraColumns() ? [...base, 'used', 'created', 'referenced'] : base;
  });

  protected readonly trackBySnapshotId = (_: number, row: ZfsSnapshot): string => row.name;

  /**
   * Selection identity. A snapshot's `name` carries both its dataset and its own name, so
   * it is unique across the whole list — which is what lets tn-table hold the selection
   * across a page turn and across a reload that rebuilt every row object.
   */
  protected readonly snapshotSelectionKey = (row: ZfsSnapshot): string => row.name;

  /**
   * `used`/`created`/`referenced` are display-only columns whose values live under `properties`,
   * so they can't sort by the raw row value at their column name.
   */
  private readonly sortAccessors: Record<string, (row: ZfsSnapshot) => number> = {
    used: (row) => getFiniteNumber(row?.properties?.used?.parsed) ?? 0,
    created: (row) => getSnapshotCreationMs(row) ?? 0,
    referenced: (row) => getFiniteNumber(row?.properties?.referenced?.parsed) ?? 0,
  };

  protected readonly emptyType$: Observable<EmptyType> = combineLatest([
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

  protected readonly emptyType = toSignal(this.emptyType$, { initialValue: EmptyType.Loading });

  get pageTitle(): string {
    if (this.searchQuery().length) {
      return this.translate.instant('Snapshots') + ': ' + this.searchQuery();
    }
    return this.translate.instant('Snapshots');
  }

  constructor() {
    this.searchQuery.set(this.route.snapshot.paramMap.get('dataset') || '');

    this.showExtraColumnsControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((willShow) => this.onToggleExtraColumns(willShow));
  }

  ngOnInit(): void {
    this.getPreferences();
    this.getSnapshots();
    this.setDefaultSort();
  }

  protected getUsed(row: ZfsSnapshot): number | undefined {
    return getFiniteNumber(row?.properties?.used?.parsed);
  }

  protected getReferenced(row: ZfsSnapshot): number | undefined {
    return getFiniteNumber(row?.properties?.referenced?.parsed);
  }

  protected getCreated(row: ZfsSnapshot): number | undefined {
    return getSnapshotCreationMs(row);
  }

  getSnapshots(): void {
    this.store$.select(selectSnapshots).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((snapshots) => {
      this.setSnapshots(snapshots);
      // A reload is not something the user asked for — a periodic snapshot task firing is
      // enough to trigger one — so it must not cost them their place or the batch they are
      // half way through building. `keepPage` holds the page, and tn-table re-points the
      // selection (keyed by `name`, see snapshotSelectionKey) at the fresh row objects the
      // store just handed back instead of dropping it.
      this.onListFiltered(this.searchQuery(), { keepPage: true });
      this.cdr.markForCheck();
    });
  }

  getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      map((preferences) => preferences.showSnapshotExtraColumns),
      take(1),
    ).subscribe((showExtraColumns) => {
      this.showExtraColumns.set(showExtraColumns);
      // Sync the toggle without re-entering the confirm flow.
      this.showExtraColumnsControl.setValue(showExtraColumns, { emitEvent: false });
      this.store$.dispatch(snapshotPageEntered());
      this.loadingExtraColumns$.next(false);
    });
  }

  private getConfirmOptions(willShow: boolean): ConfirmOptions {
    if (willShow) {
      return {
        title: this.translate.instant(helptextSnapshots.extraColumns.show),
        message: this.translate.instant(helptextSnapshots.extraColumns.showMessage),
        buttonText: this.translate.instant(helptextSnapshots.extraColumns.showButton),
        hideCheckbox: true,
      };
    }

    return {
      title: this.translate.instant(helptextSnapshots.extraColumns.hide),
      message: this.translate.instant(helptextSnapshots.extraColumns.hideMessage),
      buttonText: this.translate.instant(helptextSnapshots.extraColumns.hideButton),
      hideCheckbox: true,
    };
  }

  protected onToggleExtraColumns(willShow: boolean): void {
    this.dialogService.confirm(this.getConfirmOptions(willShow))
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.showExtraColumns.set(willShow);
          this.loadingExtraColumns$.next(true);
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
          // Revert the toggle. tn-slide-toggle latches its visual state internally,
          // so leaving the signal unchanged isn't enough — write the prior value back
          // through the control (emitEvent: false to avoid re-triggering the confirm).
          this.showExtraColumnsControl.setValue(!willShow, { emitEvent: false });
        }
      });
  }

  doAdd(): void {
    this.formPanel.open(SnapshotAddFormComponent, {
      title: this.translate.instant(helptextSnapshots.addTitle),
    });
  }

  doBatchDelete(data: ZfsSnapshot[]): void {
    this.tnDialog.open(SnapshotBatchDeleteDialog, { data })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // clearSelection(), not selection.clear(): the latter only drops the rows on screen
        // and would leave selections made on other pages to come back on the next reload.
        this.table()?.clearSelection();
        this.selectedSnapshots.set([]);
        this.cdr.markForCheck();
      });
  }

  protected onSelectionChange(snapshots: ZfsSnapshot[]): void {
    // The table only ever sees one page, so a snapshot destroyed elsewhere while it was
    // selected stays in its keyed selection. Drop anything the store no longer lists
    // before a batch action can be pointed at it.
    this.selectedSnapshots.set(snapshots.filter((snapshot) => this.snapshotNames.has(snapshot.name)));
  }

  /**
   * The one place `snapshots` is written, so the name index and the selection can never
   * drift from it.
   *
   * The prune has to happen here rather than only in `onSelectionChange`: a snapshot
   * selected on a page the user has since left is destroyed elsewhere and the reload
   * lands — nothing about the VISIBLE selection changed, so there is no guarantee
   * tn-table emits `selectionChange` for it. Dropping it where the list is rebuilt makes
   * the invariant hold whoever emits, and keeps a batch action from being pointed at a
   * snapshot that is gone.
   */
  private setSnapshots(snapshots: ZfsSnapshot[]): void {
    this.snapshots = [...snapshots];
    this.snapshotNames = new Set(this.snapshots.map((snapshot) => snapshot.name));
    this.selectedSnapshots.update(
      (selected) => selected.filter((snapshot) => this.snapshotNames.has(snapshot.name)),
    );
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(
      mapTnSortToTableSort<ZfsSnapshot>(event, this.displayedColumns(), { sortAccessors: this.sortAccessors }),
    );
  }

  /**
   * @param options `keepPage` re-runs the same query without moving the user — see
   * `BaseDataProvider.setFilter`. A query the user typed always starts at page 1.
   *
   * The dataset filter is CHOSEN before it is applied rather than applied and then undone.
   * Applying it first and falling back on an empty result cost the user their page: the
   * discarded pass ran with `keepPage`, so it clamped the page down against zero rows, and
   * the real pass then started from page 1. It also put an empty page on `currentPage$`
   * that nothing wanted to render.
   */
  protected onListFiltered(query: string, { keepPage = false }: { keepPage?: boolean } = {}): void {
    this.searchQuery.set(query);
    const datasetParam = this.route.snapshot.paramMap.get('dataset');
    const isDatasetRoute = Boolean(datasetParam) && query === datasetParam;

    this.dataProvider.setFilter(
      isDatasetRoute && this.hasSnapshotsInDataset(query)
        ? {
            list: this.snapshots,
            query,
            columnKeys: ['dataset'],
            exact: true,
          }
        : this.buildSearchFilter(query),
      { keepPage },
    );
  }

  /**
   * Mirrors what the `exact` dataset filter would match — `filterTableRows` compares both
   * sides lowercased — so the choice above lands on the same branch the discarded pass used
   * to reveal.
   */
  private hasSnapshotsInDataset(query: string): boolean {
    const target = query.toLowerCase();
    return this.snapshots.some((snapshot) => snapshot.dataset?.toLowerCase() === target);
  }

  /**
   * `name` carries both the dataset and the snapshot name, so it covers the two
   * default columns. When the extra columns are visible the search should also
   * match what those cells show — `used`, `referenced` and `created` are
   * display-only columns backed by nested `properties` fields, so we point
   * `filterTableRows` at those dot-paths (resolved via lodash `get`) and format
   * each raw value into the exact string the cell renders via the preprocessMap.
   * The casts are nominal: the paths aren't literal `ZfsSnapshot` keys.
   */
  private buildSearchFilter(query: string): TableFilter<ZfsSnapshot> {
    if (!this.showExtraColumns()) {
      return { list: this.snapshots, query, columnKeys: ['name'] };
    }

    const usedPath = 'properties.used.parsed';
    const referencedPath = 'properties.referenced.parsed';
    const createdPath = 'properties.creation.parsed';

    const preprocessMap = {
      [usedPath]: (value: unknown) => this.formatSize(value),
      [referencedPath]: (value: unknown) => this.formatSize(value),
      [createdPath]: (value: unknown) => this.formatCreated(value),
    } as TableFilter<ZfsSnapshot>['preprocessMap'];

    return {
      list: this.snapshots,
      query,
      columnKeys: ['name', usedPath, referencedPath, createdPath] as (keyof ZfsSnapshot)[],
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
