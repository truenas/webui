import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, AfterViewInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig, ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';
import { SnapshotAddComponent } from 'app/pages/storage/snapshots/snapshot-add/snapshot-add.component';
import { SnapshotCloneDialogComponent } from 'app/pages/storage/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/storage/snapshots/snapshot-table/components/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { loadSnapshots } from 'app/pages/storage/snapshots/store/snapshot.actions';
import { selectSnapshotsTotal, SnapshotSlice } from 'app/pages/storage/snapshots/store/snapshot.selectors';
import {
  DialogService, ModalService, WebSocketService, AppLoaderService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { SnapshotListEvent } from '../interfaces/snapshot-list-event.interface';
import { snapshotChanged } from '../store/snapshot.actions';
import { selectSnapshots, selectSnapshotState } from '../store/snapshot.selectors';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-list.component.html',
  styleUrls: ['./snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormatDateTimePipe],
})
export class SnapshotListComponent implements OnInit, AfterViewInit {
  error$ = this.store$.select(selectSnapshotState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectSnapshotState).pipe(map((state) => state.isLoading));
  isEmpty$ = this.store$.select(selectSnapshotsTotal).pipe(map((total) => total === 0));
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  dataSource: MatTableDataSource<SnapshotListRow> = new MatTableDataSource([]);
  defaultSort: Sort = { active: 'snapshot', direction: 'desc' };
  filterString = '';
  expandedRow: SnapshotListRow;
  selection = new SelectionModel(true, []);
  settingsEvent$: Subject<CoreEvent> = new Subject();
  showExtraColumns$ = new BehaviorSubject(false);
  toolbarConfig: ToolbarConfig;
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

  get displayedColumns(): string[] {
    if (this.showExtraColumns$.value) {
      return ['select', 'dataset', 'snapshot', 'used', 'created', 'referenced', 'actions'];
    }
    return ['select', 'dataset', 'snapshot', 'actions'];
  }

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
    private loader: AppLoaderService,
    private matDialog: MatDialog,
    private store$: Store<SnapshotSlice>,
  ) {
    if (window.localStorage.getItem('snapshotXtraCols') === 'true') {
      this.showExtraColumns$.next(true);
    }
  }

  ngOnInit(): void {
    this.store$.dispatch(loadSnapshots({ extra: this.showExtraColumns$.value }));
    this.setupToolbar();
    this.getSnapshots();
  }

  ngAfterViewInit(): void {
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getSnapshots();
    });
  }

  getSnapshots(): void {
    this.store$.select(selectSnapshots).pipe(
      map((snapshots: ZfsSnapshot[]) => {
        const snapshotListRows = [];

        for (const row of snapshots) {
          const [datasetName, snapshotName] = row.name.split('@');

          const transformedRow = {
            id: row.name,
            dataset: datasetName,
            snapshot: snapshotName,
            properties: row.properties,
            name: row.name,
          } as SnapshotListRow;

          if (row.properties) {
            snapshotListRows.push({
              ...transformedRow,
              used: parseInt(row.properties.used.rawvalue),
              created: row.properties.creation.parsed.$date,
              referenced: parseInt(row.properties.referenced.rawvalue),
            });
          } else {
            snapshotListRows.push(transformedRow);
          }
        }

        return snapshotListRows;
      }),
      untilDestroyed(this),
    ).subscribe((snapshotListRows) => {
      this.createDataSource(snapshotListRows);
      this.cdr.markForCheck();
    }, () => {
      this.createDataSource();
      this.cdr.markForCheck();
    });
  }

  getConfirmOptions(): ConfirmOptions {
    if (this.showExtraColumns$.value) {
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

  createDataSource(snapshots: SnapshotListRow[] = []): void {
    this.dataSource = new MatTableDataSource(snapshots);
    this.dataSource.sort = this.sort;
  }

  expandRow(row: SnapshotListRow): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.cdr.markForCheck();
  }

  toggleExtraColumnsDialog(): void {
    this.showExtraColumns$.next(!this.showExtraColumns$.value);
    window.localStorage.setItem('snapshotXtraCols', this.showExtraColumns$.value.toString());
    if (this.showExtraColumns$.value) {
      this.store$.dispatch(loadSnapshots({ extra: true }));
    }
    this.getSnapshots();
    this.selection.clear();
    const slideToggleControl = this.toolbarConfig.controls.find((control) => control.name === 'extra-columns');
    slideToggleControl.confirmOptions = this.getConfirmOptions();
    this.cdr.markForCheck();
  }

  onAction(event: SnapshotListEvent): void {
    switch (event.action) {
      case 'rollback':
        this.doRollback(event.row);
        break;
      case 'clone':
        this.doClone(event.row);
        break;
      case 'delete':
        this.doDelete(event.row);
        break;
    }
  }

  setupToolbar(): void {
    this.settingsEvent$.pipe(
      untilDestroyed(this),
    ).subscribe((event: CoreEvent) => {
      switch (event.data.event_control) {
        case 'filter':
          this.filterString = event.data.filter;
          this.dataSource.filter = event.data.filter;
          break;
        case 'add':
          this.doAdd();
          break;
        case 'extra-columns':
          this.toggleExtraColumnsDialog();
          break;
        default:
          break;
      }
    });

    const controls: ControlConfig[] = [
      {
        name: 'extra-columns',
        type: 'slide-toggle',
        label: this.translate.instant('Show extra columns'),
        value: this.showExtraColumns$.value,
        confirmOptions: this.getConfirmOptions(),
      },
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
        placeholder: this.translate.instant('Search'),
      },
      {
        name: 'add',
        type: 'button',
        label: this.translate.instant('Add'),
        color: 'primary',
        ixAutoIdentifier: 'Snapshots_ADD',
      },
    ];

    const toolbarConfig: ToolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;
    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }

  selectAll(): void {
    this.dataSource.data.forEach((snapshot) => this.selection.select(snapshot));
    this.cdr.markForCheck();
  }

  doAdd(): void {
    this.modalService.openInSlideIn(SnapshotAddComponent);
  }

  doClone(snapshot: SnapshotListRow): void {
    this.matDialog.open(SnapshotCloneDialogComponent, {
      data: snapshot.id,
    });
  }

  doRollback(row: SnapshotListRow): void {
    this.loader.open();
    this.ws.call('zfs.snapshot.query', [[['id', '=', row.name]]]).pipe(
      map((snapshots) => snapshots[0]),
      tap((snapshot) => {
        snapshotChanged({ snapshot });
        this.loader.close();
      }),
      switchMap((snapshot) => this.matDialog.open(SnapshotRollbackDialogComponent, { data: snapshot }).afterClosed()),
      untilDestroyed(this),
    ).subscribe({
      error: (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    });
  }

  doDelete(snapshot: SnapshotListRow): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete snapshot {name}?', { name: snapshot.name }),
      buttonMsg: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.ws.call('zfs.snapshot.delete', [snapshot.name])),
      untilDestroyed(this),
    ).subscribe(
      () => {
        this.loader.close();
      },
      (error: WebsocketError) => {
        console.error(error);
        this.loader.close();
      },
    );
  }

  doBatchDelete(snapshots: SnapshotListRow[]): void {
    this.matDialog.open(SnapshotBatchDeleteDialogComponent, {
      data: snapshots,
    }).beforeClosed().pipe(
      filter((isCancelled) => !isCancelled),
      untilDestroyed(this),
    ).subscribe(() => {
      this.selection.clear();
      this.cdr.markForCheck();
    });
  }
}
