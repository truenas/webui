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
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig, ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnapshotDialogData } from 'app/pages/storage/snapshots/interfaces/snapshot-dialog-data.interface';
import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';
import { SnapshotAddComponent } from 'app/pages/storage/snapshots/snapshot-add/snapshot-add.component';
import { SnapshotCloneDialogComponent } from 'app/pages/storage/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
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
  selector: 'app-snapshot-table',
  templateUrl: './snapshot-table.component.html',
  styleUrls: ['./snapshot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormatDateTimePipe],
})
export class SnapshotTableComponent implements OnInit, AfterViewInit {
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
    title: this.translate.instant('Can not retrieve response'),
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
    this.setupToolbar();
    this.getSnapshots();
  }

  ngAfterViewInit(): void {
    this.store$.dispatch(loadSnapshots({ extra: this.showExtraColumns$.value }));
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

  createDataSource(snapshots: SnapshotListRow[] = []): void {
    this.dataSource = new MatTableDataSource(snapshots);
    this.dataSource.sort = this.sort;
  }

  expandRow(row: SnapshotListRow): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.cdr.markForCheck();
  }

  toggleExtraColumnsDialog(): void {
    let dialogOptions: ConfirmOptions;
    if (this.showExtraColumns$.value) {
      dialogOptions = {
        title: this.translate.instant(helptext.extra_cols.title_hide),
        message: this.translate.instant(helptext.extra_cols.message_hide),
        buttonMsg: this.translate.instant(helptext.extra_cols.button_hide),
        hideCheckBox: true,
      };
    } else {
      dialogOptions = {
        title: this.translate.instant(helptext.extra_cols.title_show),
        message: this.translate.instant(helptext.extra_cols.message_show),
        buttonMsg: this.translate.instant(helptext.extra_cols.button_show),
        hideCheckBox: true,
      };
    }

    this.dialogService.confirm(dialogOptions).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.showExtraColumns$.next(!this.showExtraColumns$.value);
      window.localStorage.setItem('snapshotXtraCols', this.showExtraColumns$.value.toString());
      if (this.showExtraColumns$.value) {
        this.store$.dispatch(loadSnapshots({ extra: true }));
      }
      this.getSnapshots();
      this.selection.clear();
    });
  }

  doAdd(): void {
    this.modalService.openInSlideIn(SnapshotAddComponent);
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

  wsMultiDeleteParams(selected: SnapshotListRow[]): (string | string[][])[] {
    const snapshots = selected.map((item) => [item.dataset + '@' + item.snapshot]);
    return ['zfs.snapshot.delete', snapshots, '{0}'];
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

  restructureData(selected: SnapshotListRow[]): SnapshotDialogData {
    const datasets: string[] = [];
    const snapshots: { [index: string]: string[] } = {};
    selected.forEach((item) => {
      if (!snapshots[item.dataset]) {
        datasets.push(item.dataset);
        snapshots[item.dataset] = [];
      }

      snapshots[item.dataset].push(item.snapshot);
    });

    return { datasets, snapshots };
  }

  getMultiDeleteMessage(selected: SnapshotListRow[]): string {
    let message = this.translate.instant(
      '<strong>The following { n, plural, one {snapshot} other {# snapshots} } will be deleted. Are you sure you want to proceed?</strong>',
      { n: selected.length },
    );

    message += '<br>';
    const info: SnapshotDialogData = this.restructureData(selected);

    const datasetStart = "<div class='mat-list-item'>";
    const datasetEnd = '</div>';
    const listStart = '<ul>';
    const listEnd = '</ul>';
    const breakTag = '<br>';

    info.datasets.forEach((dataset) => {
      const totalSnapshots: number = info.snapshots[dataset].length;
      const snapshotText = this.translate.instant(
        '{ n, plural, one {# snapshot} other {# snapshots} }',
        { n: totalSnapshots },
      );
      const header = `<br/> <div><strong>${dataset}</strong> (${snapshotText}) </div>`;
      const listContent: string[] = [];

      info.snapshots[dataset].forEach((snapshot) => {
        listContent.push('<li>&nbsp;&nbsp;&nbsp;&nbsp;' + snapshot + '</li>');
      });

      const listContentString: string = listContent.toString();
      message += datasetStart + header + listStart + listContentString.replace(/\,/g, '') + listEnd + breakTag + datasetEnd;
    });

    return message;
  }

  doMultiDelete(selected: SnapshotListRow[]): void {
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: multiDeleteMsg,
      buttonMsg: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.startMultiDeleteProgress(selected));
  }

  startMultiDeleteProgress(selected: SnapshotListRow[]): void {
    const params = this.wsMultiDeleteParams(selected);
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Deleting Snapshots'),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('core.bulk', params as CoreBulkQuery);
    dialogRef.componentInstance.submit();

    dialogRef.componentInstance.success
      .pipe(untilDestroyed(this))
      .subscribe((job: Job<CoreBulkResponse<boolean>[]>) => {
        const jobErrors: string[] = [];
        const jobSuccess: boolean[] = [];

        job.result.forEach((item) => {
          if (item.error) {
            jobErrors.push(item.error);
          } else {
            jobSuccess.push(item.result);
          }
        });

        dialogRef.close();
        // this.entityList.getData();

        if (jobErrors.length > 0) {
          const errorTitle = this.translate.instant('Warning: {n} of {total} snapshots could not be deleted.', { n: jobErrors.length, total: params[1].length });

          let errorMessage = jobErrors.map((err) => err + '\n').toString();
          errorMessage = errorMessage.split(',').join('');
          errorMessage = errorMessage.split('[').join('\n *** [');
          errorMessage = errorMessage.split(']').join(']\n');

          this.dialogService.errorReport(errorTitle, '', errorMessage);
        } else {
          this.dialogService.info(
            this.translate.instant('Deleted {n, plural, one {# snapshot} other {# snapshots}}', { n: jobSuccess.length }),
            '',
            '320px',
            'info',
            true,
          );
        }
      });

    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
      // new EntityUtils().handleWsError(this.entityList, err, this.dialogService);
      dialogRef.close();
    });
  }

  selectAll(): void {
    this.dataSource.data.forEach((snapshot) => this.selection.select(snapshot));
    this.cdr.markForCheck();
  }

  doClone(snapshot: SnapshotListRow): void {
    console.info('doClone', snapshot);
    this.matDialog.open(SnapshotCloneDialogComponent, {
      data: snapshot.id,
    });
  }

  doRollback(row: SnapshotListRow): void {
    console.info('doRollback', row);
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
}
