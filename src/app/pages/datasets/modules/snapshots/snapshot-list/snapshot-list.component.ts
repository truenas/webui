import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnInit,
  computed, effect, inject, signal, viewChild,
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
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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

  protected readonly requiredRoles = [Role.SnapshotDelete];
  searchQuery = signal('');
  dataProvider = new ArrayDataProvider<ZfsSnapshot>();
  snapshots: ZfsSnapshot[] = [];
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

  // tn-table allows multiple rows expanded at once and exposes no single-expand input, so we
  // restore the previous ix-table single-expand behavior: whenever a second row opens we collapse
  // back to just the newly-opened one. Diff against the previous set (rather than caching a single
  // reference) so a data reload swapping in fresh row objects can't leave a stale reference behind.
  private previousExpandedRows = new Set<unknown>();

  private readonly sortByMap: Record<string, (row: ZfsSnapshot) => number> = {
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

    effect(() => {
      const table = this.table();
      if (!table) {
        return;
      }
      const expanded = table.expandedRows();
      if (expanded.size <= 1) {
        this.previousExpandedRows = new Set(expanded);
        return;
      }
      const newest = [...expanded].find((row) => !this.previousExpandedRows.has(row));
      const collapsed = newest ? new Set<unknown>([newest]) : new Set<unknown>();
      this.previousExpandedRows = collapsed;
      table.expandedRows.set(collapsed);
    });

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
      // The store hands back fresh row objects on every emission, so any prior
      // selection now points at stale references that no longer map to visible
      // rows. Clear it before swapping in the new set so the batch-operations
      // toolbar can't act on a phantom selection.
      //
      // Reconciling the prior selection by `name` (to preserve an in-progress
      // batch across a background reload) isn't achievable here: tn-table clears
      // its own selection whenever the `dataSource` reference changes, so any rows
      // we re-selected would be wiped by that internal effect on the next tick.
      // Preserving intent would need key-based selection support in tn-table.
      this.table()?.selection.clear();
      this.selectedSnapshots.set([]);
      this.snapshots = [...snapshots];
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
      title: this.translate.instant('Add Snapshot'),
    });
  }

  doBatchDelete(data: ZfsSnapshot[]): void {
    this.tnDialog.open(SnapshotBatchDeleteDialog, { data })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.table()?.selection.clear();
        this.selectedSnapshots.set([]);
        this.cdr.markForCheck();
      });
  }

  protected onSelectionChange(snapshots: ZfsSnapshot[]): void {
    this.selectedSnapshots.set(snapshots);
  }

  protected onRowClick(row: ZfsSnapshot): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    const direction = event.direction === '' ? null : (event.direction as SortDirection);
    // `dataset`/`snapshot_name` are real ZfsSnapshot keys the data provider can sort on
    // directly. `used`/`created`/`referenced` are display-only columns whose values live
    // under `properties`, so the cast is nominal for those — the sortByMap override below
    // supplies the actual accessor and `propertyName` is never read for them.
    const sorting: TableSort<ZfsSnapshot> = {
      propertyName: direction ? (event.column as keyof ZfsSnapshot) : null,
      direction,
      active: null,
    };
    if (direction && this.sortByMap[event.column]) {
      sorting.sortBy = this.sortByMap[event.column];
    }
    this.dataProvider.setSorting(sorting);
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
        this.dataProvider.setFilter({ list: this.snapshots, query, columnKeys: ['name'] });
      }
    } else {
      this.dataProvider.setFilter({ list: this.snapshots, query, columnKeys: ['name'] });
    }
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Desc,
      propertyName: 'name',
    });
  }
}
