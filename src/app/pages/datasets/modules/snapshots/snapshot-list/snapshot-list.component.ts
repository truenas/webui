import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, of,
} from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ArrayDataProvider } from 'app/modules/ix-table2/classes/array-data-provider/array-data-provider';
import { checkboxColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { dateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { sizeColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { snapshotPageEntered } from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { selectSnapshotState, selectSnapshots, selectSnapshotsTotal } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { snapshotExtraColumnsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

// TODO: Exclude AnythingUi when NAS-127632 is done
export interface ZfsSnapshotUi extends ZfsSnapshot {
  selected: boolean;
}

@UntilDestroy()
@Component({
  templateUrl: './snapshot-list.component.html',
  styleUrls: ['./snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotListComponent implements OnInit {
  protected readonly requiredRoles = [Role.SnapshotDelete];
  datasetFilter = '';
  dataProvider = new ArrayDataProvider<ZfsSnapshotUi>();
  snapshots: ZfsSnapshotUi[] = [];
  showExtraColumnsControl = new FormControl<boolean>(false);
  loadingExtraColumns$ = new BehaviorSubject(true);
  isLoading$ = combineLatest([
    this.store$.select(selectSnapshotState).pipe(map((state) => state.isLoading)),
    this.loadingExtraColumns$,
  ]).pipe(map(([isLoading, loadingExtraColumns]) => isLoading || loadingExtraColumns));
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
        this.snapshots.find((snapshot) => row.name === snapshot.name).selected = checked;
        this.dataProvider.setRows([]);
        this.dataProvider.setRows(this.snapshots.filter(this.filterSnapshot));
      },
      onColumnCheck: (checked) => {
        this.snapshots.forEach((bootenv) => bootenv.selected = checked);
        this.dataProvider.setRows([]);
        this.dataProvider.setRows(this.snapshots.filter(this.filterSnapshot));
      },
      cssClass: 'checkboxs-column',
    }),
    textColumn({
      title: this.translate.instant('Dataset'),
      propertyName: 'dataset',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Snapshot'),
      propertyName: 'snapshot_name',
      sortable: true,
    }),
    sizeColumn({
      title: this.translate.instant('Used'),
      sortable: true,
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => row?.properties?.used?.parsed,
      sortBy: (row) => row?.properties?.used?.parsed as string,
    }),
    dateColumn({
      title: this.translate.instant('Date created'),
      sortable: true,
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => row?.properties?.creation?.parsed.$date,
      sortBy: (row) => row?.properties?.creation?.parsed.$date,
    }),
    sizeColumn({
      title: this.translate.instant('Referenced'),
      sortable: true,
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => row?.properties?.referenced?.parsed,
      sortBy: (row) => row?.properties?.referenced?.parsed as string,
    }),
  ], {
    rowTestId: (row) => 'snapshot-' + row.id,
  });

  get pageTitle(): string {
    if (this.datasetFilter.length) {
      return this.translate.instant('Snapshots') + ': ' + this.datasetFilter;
    }
    return this.translate.instant('Snapshots');
  }

  get selectedSnapshots(): ZfsSnapshotUi[] {
    return this.snapshots
      .filter(this.filterSnapshot)
      .filter((snapshot) => snapshot.selected);
  }

  get selectionHasItems(): boolean {
    return this.selectedSnapshots.some((snapshot) => snapshot.selected);
  }

  constructor(
    protected emptyService: EmptyService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private route: ActivatedRoute,
  ) {
    this.datasetFilter = this.route.snapshot.paramMap.get('dataset') || '';
  }

  ngOnInit(): void {
    this.store$.dispatch(snapshotPageEntered());
    this.getPreferences();
    this.getSnapshots();
    this.setDefaultSort();
    this.listenForShowExtraColumnsChange();
  }

  listenForShowExtraColumnsChange(): void {
    this.showExtraColumnsControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.toggleExtraColumns());
  }

  updateColumnVisibility(): void {
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
        return this.snapshots.filter(this.filterSnapshot);
      }),
      untilDestroyed(this),
    ).subscribe((snapshots) => {
      this.dataProvider.setRows(snapshots);
      this.cdr.markForCheck();
    });
  }

  getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      map((preferences) => preferences.showSnapshotExtraColumns),
      untilDestroyed(this),
    ).subscribe((showExtraColumns) => {
      this.showExtraColumnsControl.setValue(showExtraColumns, { emitEvent: false });
      this.updateColumnVisibility();
      this.store$.dispatch(snapshotPageEntered());
      this.loadingExtraColumns$.next(false);
    });
  }

  getConfirmOptions(): ConfirmOptions {
    if (!this.showExtraColumnsControl.value) {
      return {
        title: this.translate.instant(helptextSnapshots.extra_cols.title_hide),
        message: this.translate.instant(helptextSnapshots.extra_cols.message_hide),
        buttonText: this.translate.instant(helptextSnapshots.extra_cols.button_hide),
        hideCheckbox: true,
      };
    }

    return {
      title: this.translate.instant(helptextSnapshots.extra_cols.title_show),
      message: this.translate.instant(helptextSnapshots.extra_cols.message_show),
      buttonText: this.translate.instant(helptextSnapshots.extra_cols.button_show),
      hideCheckbox: true,
    };
  }

  toggleExtraColumns(): void {
    this.dialogService.confirm(this.getConfirmOptions())
      .pipe(take(1), untilDestroyed(this))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.loadingExtraColumns$.next(true);
          this.updateColumnVisibility();
          this.store$.dispatch(snapshotExtraColumnsToggled());
        } else {
          this.showExtraColumnsControl.setValue(!this.showExtraColumnsControl.value, { emitEvent: false });
        }
      });
  }

  doAdd(): void {
    this.slideInService.open(SnapshotAddFormComponent);
  }

  doBatchDelete(data: ZfsSnapshotUi[]): void {
    this.matDialog.open(SnapshotBatchDeleteDialogComponent, { data, disableClose: true })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.selectedSnapshots.forEach((snapshot) => snapshot.selected = false);
        this.cdr.markForCheck();
      });
  }

  protected onListFiltered(query: string): void {
    this.datasetFilter = query;
    this.dataProvider.setRows(this.snapshots.filter(this.filterSnapshot));
  }

  private filterSnapshot = (snapshot: ZfsSnapshotUi): boolean => {
    return snapshot.name.includes(this.datasetFilter);
  };

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Desc,
      propertyName: 'name',
    });
  }
}
