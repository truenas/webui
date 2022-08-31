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
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { snapshotPageEntered } from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { selectSnapshotsTotal, selectSnapshots, selectSnapshotState } from 'app/pages/datasets/modules/snapshots/store/snapshot.selectors';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';

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
  displayedColumns: string[] = this.defaultColumns;
  dataset = '';

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private store$: Store<AppState>,
    private slideIn: IxSlideInService,
    private layoutService: LayoutService,
    private route: ActivatedRoute,
  ) {
    this.dataset = this.route.snapshot.paramMap.get('dataset') || '';
  }

  ngOnInit(): void {
    this.store$.dispatch(snapshotPageEntered());
    this.getSnapshots();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getSnapshots(): void {
    this.store$.pipe(
      select(selectSnapshots),
      untilDestroyed(this),
    ).subscribe((snapshots) => {
      this.createDataSource(snapshots);
      this.cdr.markForCheck();
    }, () => {
      this.createDataSource();
      this.cdr.markForCheck();
    });
  }

  createDataSource(snapshots: ZfsSnapshot[] = []): void {
    this.dataSource = new MatTableDataSource(snapshots);
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'snapshot_name':
          return item.snapshot_name;
        case 'dataset':
          return item.dataset;
      }
    };
    setTimeout(() => {
      // TODO: Figure out how to avoid setTimeout to make it work on first loading
      this.dataSource.sort = this.sort;
      this.cdr.markForCheck();
    }, 0);
    this.dataSource.filter = this.dataset;
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
    this.dataSource.filter = query;
  }
}
