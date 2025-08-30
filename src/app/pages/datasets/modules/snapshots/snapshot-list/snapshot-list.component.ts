import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
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
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SnapshotBatchDeleteDialog } from 'app/pages/datasets/modules/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { SnapshotDetailsRowComponent } from 'app/pages/datasets/modules/snapshots/snapshot-details-row/snapshot-details-row.component';
import { snapshotListElements } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.elements';
import { snapshotPageEntered } from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { selectSnapshotState, selectSnapshots, selectSnapshotsTotal } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { AppState } from 'app/store';
import { snapshotExtraColumnsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

// TODO: Exclude AnythingUi when NAS-127632 is done
export interface ZfsSnapshotUi extends ZfsSnapshot {
  selected: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-list',
  templateUrl: './snapshot-list.component.html',
  styleUrls: ['./snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    IxIconComponent,
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
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private matDialog = inject(MatDialog);
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private route = inject(ActivatedRoute);

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
          untilDestroyed(this),
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
      getValue: (row) => row?.properties?.used?.parsed,
    }),
    dateColumn({
      title: this.translate.instant('Date created'),
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => row?.properties?.creation?.parsed.$date,
    }),
    sizeColumn({
      title: this.translate.instant('Referenced'),
      hidden: !this.showExtraColumnsControl.value,
      getValue: (row) => row?.properties?.referenced?.parsed,
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
    this.store$.dispatch(snapshotPageEntered());
    this.getPreferences();
    this.getSnapshots();
    this.setDefaultSort();
    this.listenForShowExtraColumnsChange();
  }

  private listenForShowExtraColumnsChange(): void {
    this.showExtraColumnsControl.valueChanges
      .pipe(untilDestroyed(this))
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
      untilDestroyed(this),
    ).subscribe(() => {
      this.onListFiltered(this.searchQuery());
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
    this.slideIn.open(SnapshotAddFormComponent);
  }

  doBatchDelete(data: ZfsSnapshotUi[]): void {
    this.matDialog.open(SnapshotBatchDeleteDialog, { data, disableClose: true })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
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
