import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  OnInit,
  TemplateRef,
  AfterViewInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of, Observable } from 'rxjs';
import {
  filter, map, switchMap,
} from 'rxjs/operators';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { snapshotPageEntered } from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { selectSnapshotsTotal, selectSnapshots, selectSnapshotState } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { snapshotExtraColumnsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-list.component.html',
  styleUrls: ['./snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormatDateTimePipe],
})
export class SnapshotListComponent implements OnInit, AfterViewInit {
  isLoading$ = this.store$.select(selectSnapshotState).pipe(map((state) => state.isLoading));
  emptyOrErrorConfig$: Observable<EmptyConfig> = combineLatest([
    this.store$.select(selectSnapshotsTotal).pipe(map((total) => total === 0)),
    this.store$.select(selectSnapshotState).pipe(map((state) => state.error)),
  ]).pipe(
    switchMap(([, isError]) => {
      if (isError) {
        return of(this.errorConfig);
      }

      return of(this.emptyConfig);
    }),
  );
  showExtraColumns: boolean;
  expandedRow: ZfsSnapshot;
  @ViewChildren(IxDetailRowDirective) private detailRows: QueryList<IxDetailRowDirective>;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(IxCheckboxColumnComponent, { static: false }) checkboxColumn: IxCheckboxColumnComponent<ZfsSnapshot>;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  dataSource: MatTableDataSource<ZfsSnapshot> = new MatTableDataSource([]);
  defaultSort: Sort = { active: 'snapshot_name', direction: 'desc' };
  emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    title: this.translate.instant('No snapshots are available.'),
    large: true,
  };
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  errorConfig: EmptyConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Snapshots could not be loaded'),
  };
  readonly defaultColumns: string[] = ['select', 'dataset', 'snapshot_name', 'actions'];
  readonly defaultExtraColumns: string[] = ['select', 'dataset', 'snapshot_name', 'used', 'created', 'referenced', 'actions'];
  displayedColumns: string[] = this.defaultColumns;
  datasetFilter = '';

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private store$: Store<AppState>,
    private slideIn: IxSlideInService,
    private layoutService: LayoutService,
    private route: ActivatedRoute,
  ) {
    this.datasetFilter = this.route.snapshot.paramMap.get('dataset') || '';
  }

  ngOnInit(): void {
    this.store$.dispatch(snapshotPageEntered());
    this.getPreferences();
    this.getSnapshots();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getPreferences(): void {
    this.store$.pipe(
      waitForPreferences,
      map((preferences) => preferences.showSnapshotExtraColumns),
      untilDestroyed(this),
    ).subscribe((showExtraColumns) => {
      this.store$.dispatch(snapshotPageEntered());
      this.showExtraColumns = showExtraColumns;
      this.displayedColumns = this.showExtraColumns ? this.defaultExtraColumns : this.defaultColumns;
      this.cdr.markForCheck();
    });
  }

  getSnapshots(): void {
    this.store$.pipe(
      select(selectSnapshots),
      untilDestroyed(this),
    ).subscribe({
      next: (snapshots) => {
        this.createDataSource(snapshots);
        this.cdr.markForCheck();
      },
      error: () => {
        this.createDataSource();
        this.cdr.markForCheck();
      },
    });
  }

  getConfirmOptions(): ConfirmOptions {
    if (this.showExtraColumns) {
      return {
        title: this.translate.instant(helptext.extra_cols.title_hide),
        message: this.translate.instant(helptext.extra_cols.message_hide),
        buttonMsg: this.translate.instant(helptext.extra_cols.button_hide),
        hideCheckBox: true,
      };
    }

    return {
      title: this.translate.instant(helptext.extra_cols.title_show),
      message: this.translate.instant(helptext.extra_cols.message_show),
      buttonMsg: this.translate.instant(helptext.extra_cols.button_show),
      hideCheckBox: true,
    };
  }

  createDataSource(snapshots: ZfsSnapshot[] = []): void {
    this.dataSource = new MatTableDataSource(snapshots);
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'snapshot_name':
          return item.snapshot_name;
        case 'dataset':
          return item.dataset;
        case 'used':
          return item.properties ? item.properties.used.parsed.toString() : '';
        case 'created':
          return item.properties ? item.properties.creation.parsed.$date.toString() : '';
        case 'referenced':
          return item.properties ? item.properties.referenced.parsed.toString() : '';
      }
    };
    setTimeout(() => {
      // TODO: Figure out how to avoid setTimeout to make it work on first loading
      this.dataSource.sort = this.sort;
      this.cdr.markForCheck();
    }, 0);
    this.dataSource.filter = this.datasetFilter;
  }

  toggleExtraColumns(event: MouseEvent): void {
    event.preventDefault();
    this.dialogService.confirm(this.getConfirmOptions())
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.store$.dispatch(snapshotExtraColumnsToggled()));
  }

  doAdd(): void {
    this.slideIn.open(SnapshotAddFormComponent);
  }

  doBatchDelete(snapshots: ZfsSnapshot[]): void {
    this.matDialog.open(SnapshotBatchDeleteDialogComponent, {
      data: snapshots,
      disableClose: true,
    }).afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.checkboxColumn.clearSelection();
      this.cdr.markForCheck();
    });
  }

  onToggle(row: ZfsSnapshot): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.toggleDetailRows();
    this.cdr.markForCheck();
  }

  toggleDetailRows(): void {
    this.detailRows.forEach((row) => {
      if (row.expanded && row.ixDetailRow !== this.expandedRow) {
        row.close();
      } else if (!row.expanded && row.ixDetailRow === this.expandedRow) {
        row.open();
      }
    });
  }

  onSearch(query: string): void {
    this.datasetFilter = query;
    this.dataSource.filter = query;
  }
}
