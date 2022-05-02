import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  Subject, combineLatest, of, Observable,
} from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig, ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { SnapshotAddFormComponent } from 'app/pages/storage/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/storage/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { SnapshotCloneDialogComponent } from 'app/pages/storage/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { snapshotPageEntered } from 'app/pages/storage/snapshots/store/snapshot.actions';
import { selectSnapshotsTotal, selectSnapshots, selectSnapshotState } from 'app/pages/storage/snapshots/store/snapshot.selectors';
import {
  DialogService, WebSocketService, AppLoaderService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
export class SnapshotListComponent implements OnInit {
  error$ = this.store$.select(selectSnapshotState).pipe(map((state) => state.error));
  isLoading$ = this.store$.select(selectSnapshotState).pipe(map((state) => state.isLoading));
  isEmpty$ = this.store$.select(selectSnapshotsTotal).pipe(map((total) => total === 0));
  emptyOrErrorConfig$: Observable<EmptyConfig> = combineLatest([this.isEmpty$, this.error$]).pipe(
    switchMap(([_, isError]) => {
      if (isError) {
        return of(this.errorConfig);
      }

      return of(this.emptyConfig);
    }),
  );
  showExtraColumns: boolean;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(IxCheckboxColumnComponent, { static: false }) checkboxColumn: IxCheckboxColumnComponent<ZfsSnapshot>;
  dataSource: MatTableDataSource<ZfsSnapshot> = new MatTableDataSource([]);
  defaultSort: Sort = { active: 'snapshot_name', direction: 'desc' };
  filterString = '';
  toolbarEvent$: Subject<CoreEvent> = new Subject();
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
  readonly defaultColumns: string[] = ['select', 'dataset', 'snapshot_name', 'actions'];
  readonly defaultExtraColumns: string[] = ['select', 'dataset', 'snapshot_name', 'used', 'created', 'referenced', 'actions'];
  displayedColumns: string[] = this.defaultColumns;

  constructor(
    private dialogService: DialogService,
    private websocket: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
    private loader: AppLoaderService,
    private matDialog: MatDialog,
    private store$: Store<AppState>,
    private slideIn: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.store$.dispatch(snapshotPageEntered());
    this.setupToolbar();
    this.getPreferences();
    this.getSnapshots();
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
      this.setupToolbar();
      this.cdr.markForCheck();
    });
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
      if (this.filterString) {
        this.dataSource.filter = this.filterString;
      }
      this.dataSource.sort = this.sort;
      this.cdr.markForCheck();
    }, 0);
  }

  toggleExtraColumns(): void {
    this.store$.dispatch(snapshotExtraColumnsToggled());
  }

  getToolbarEvents(): void {
    this.toolbarEvent$ = new Subject();
    this.toolbarEvent$.pipe(
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
          this.toggleExtraColumns();
          break;
        default:
          break;
      }
    });
  }
  setupToolbar(): void {
    this.getToolbarEvents();
    const controls: ControlConfig[] = [
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
        placeholder: this.translate.instant('Search'),
      },
      {
        name: 'extra-columns',
        type: 'slide-toggle',
        label: this.translate.instant('Show extra columns'),
        value: this.showExtraColumns,
        confirmOptions: this.getConfirmOptions(),
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
      target: this.toolbarEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;
    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }

  doAdd(): void {
    this.slideIn.open(SnapshotAddFormComponent);
  }

  doClone(snapshot: ZfsSnapshot): void {
    this.matDialog.open(SnapshotCloneDialogComponent, {
      data: snapshot.name,
    });
  }

  doRollback(snapshot: ZfsSnapshot): void {
    this.matDialog.open(SnapshotRollbackDialogComponent, { data: snapshot.name });
  }

  doDelete(snapshot: ZfsSnapshot): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete snapshot {name}?', { name: snapshot.name }),
      buttonMsg: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.websocket.call('zfs.snapshot.delete', [snapshot.name])),
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
}
