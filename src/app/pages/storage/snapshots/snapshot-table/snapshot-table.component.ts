import {
  Component, OnInit, ChangeDetectionStrategy, AfterViewInit, ChangeDetectorRef, ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { SnapshotLoadAction } from 'app/store/actions/storage-snapshot.actions';
import { AppState } from 'app/store/reducers';
import {
  selectSnapshotTotal, selectSnapshotLoading, selectAllSnapshot, selectSnapshotError,
} from 'app/store/selectors/storage-snapshot.selectors';
import { ModalService } from '../../../../services/modal.service';
import { SnapshotAddComponent } from '../snapshot-add/snapshot-add.component';
import { SnapshotListRow } from '../snapshot-list/snapshot-list-row.interface';

@UntilDestroy()
@Component({
  selector: 'app-snapshot-table',
  templateUrl: './snapshot-table.component.html',
  styleUrls: ['./snapshot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  total = 0;
  loading: boolean;
  error$: Observable<boolean>;
  dataSource: MatTableDataSource<SnapshotListRow>;
  private subscription: Subscription = new Subscription();

  columns = [
    { name: 'Dataset', prop: 'dataset' },
    { name: 'Snapshot', prop: 'snapshot' },
    { name: 'Used', prop: 'used' },
    { name: 'Date Created', prop: 'created' },
    { name: 'Referenced', prop: 'referenced' },
  ];

  constructor(
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService,
  ) { }

  ngOnInit(): void {
    this.store$.pipe(select(selectAllSnapshot)).pipe(
      untilDestroyed(this),
    ).subscribe(
      (snapshots) => this.initializeData(snapshots),
    );

    this.store$.pipe(
      select(selectSnapshotTotal),
      untilDestroyed(this),
    ).subscribe(
      (total) => this.total = total,
    );

    this.subscription.add(this.store$.pipe(
      select(selectSnapshotLoading),
      untilDestroyed(this),
    ).subscribe(
      (loading) => {
        if (loading) {
          this.dataSource = new MatTableDataSource([]);
        }
        this.loading = loading;
        this.cdr.markForCheck();
      },
    ));

    this.error$ = this.store$.pipe(select(selectSnapshotError));
  }

  ngAfterViewInit(): void {
    this.loadSnapshots();
  }

  initializeData(snapshots: SnapshotListRow[]): void {
    console.info('initializeData', snapshots);
    this.dataSource = new MatTableDataSource(snapshots.length ? snapshots : []);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.cdr.markForCheck();
  }

  loadSnapshots(): void {
    this.store$.dispatch(new SnapshotLoadAction([
      [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
      { select: ['name', 'properties'], order_by: ['name'] },
    ]));
  }

  doAdd(): void {
    this.modalService.openInSlideIn(SnapshotAddComponent);
  }
}
