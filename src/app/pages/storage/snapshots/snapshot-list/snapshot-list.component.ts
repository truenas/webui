import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild,
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
  filter, map, switchMap, take, tap,
} from 'rxjs/operators';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { TableDisplayedColumns } from 'app/interfaces/preferences.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig, ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/storage/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { SnapshotCloneDialogComponent } from 'app/pages/storage/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { snapshotExtraColumnsPreferenceLoaded, snapshotPageEntered } from 'app/pages/storage/snapshots/store/snapshot.actions';
import { selectSnapshotsTotal } from 'app/pages/storage/snapshots/store/snapshot.selectors';
import {
  DialogService, ModalService, WebSocketService, AppLoaderService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { preferredColumnsUpdated, snapshotExtraColumnsToggled } from 'app/store/preferences/preferences.actions';
import { selectPreferencesState, waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { SnapshotAddFormComponent } from '../snapshot-add-form/snapshot-add-form.component';
import { selectSnapshots, selectSnapshotState } from '../store/snapshot.selectors';

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
  showExtraColumns: boolean;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  dataSource: MatTableDataSource<ZfsSnapshot> = new MatTableDataSource([]);
  defaultSort: Sort = { active: 'snapshot', direction: 'desc' };
  filterString = '';
  selection = new SelectionModel(true, []);
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
  emptyOrErrorConfig$: Observable<EmptyConfig> = combineLatest([this.isEmpty$, this.error$]).pipe(
    switchMap(([isError]) => {
      if (isError) {
        return of(this.errorConfig);
      }

      return of(this.emptyConfig);
    }),
  );
  snapshotPreferredColumnsKey = 'snapshot-list';
  readonly defaultColumns: string[] = ['select', 'dataset', 'snapshot', 'actions'];
  readonly defaultExtraColumns: string[] = ['select', 'dataset', 'snapshot', 'used', 'created', 'referenced', 'actions'];
  displayedColumns: string[];
  firstUse = true;

  constructor(
    private dialogService: DialogService,
    private websocket: WebSocketService,
    private translate: TranslateService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
    private loader: AppLoaderService,
    private matDialog: MatDialog,
    private store$: Store<AppState>,
    private slideIn: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.store$.dispatch(snapshotPageEntered());
    this.loadPreferredColumns();
    this.getSnapshots();
  }

  selectColumnsToShow(): void {
    this.store$.pipe(
      select(selectPreferencesState),
      take(1),
      untilDestroyed(this),
    ).subscribe((state) => {
      if (!state.areLoaded) {
        return;
      }
      this.store$.dispatch(snapshotPageEntered());
      this.showExtraColumns = state.preferences.showSnapshotExtraColumns;
      this.displayedColumns = this.showExtraColumns ? this.defaultExtraColumns : this.defaultColumns;

      const newColumnPreferences: TableDisplayedColumns = {
        title: this.snapshotPreferredColumnsKey,
        cols: this.displayedColumns.map((name) => ({ name })),
      } as TableDisplayedColumns;
      const existingPreferredColumns = state.preferences.tableDisplayedColumns || [];
      const preferredColumns = existingPreferredColumns.filter((column) => {
        return this.snapshotPreferredColumnsKey !== column.title;
      });
      preferredColumns.push(newColumnPreferences);

      this.setupToolbar();
      this.store$.dispatch(preferredColumnsUpdated({ columns: preferredColumns }));
      this.store$.dispatch(snapshotExtraColumnsPreferenceLoaded({ extra: this.showExtraColumns }));
      this.cdr.markForCheck();
    });
  }

  getSnapshots(): void {
    this.store$.select(selectSnapshots).pipe(
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
    this.dataSource.sort = this.sort;
    if (this.filterString) {
      this.dataSource.filter = this.filterString;
    }
    this.selection.clear();
  }

  toggleExtraColumns(): void {
    this.store$.dispatch(snapshotExtraColumnsToggled());
    this.selectColumnsToShow();
    this.cdr.markForCheck();
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
        name: 'extra-columns',
        type: 'slide-toggle',
        label: this.translate.instant('Show extra columns'),
        value: this.showExtraColumns,
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
    }).beforeClosed().pipe(
      filter((isCancelled) => !isCancelled),
      untilDestroyed(this),
    ).subscribe(() => {
      this.selection.clear();
      this.cdr.markForCheck();
    });
  }

  private loadPreferredColumns(): void {
    this.store$.pipe(waitForPreferences, take(1), untilDestroyed(this)).subscribe((preferences) => {
      const preferredCols = preferences.tableDisplayedColumns || [];

      preferredCols.forEach((column) => {
        if (column.title === this.snapshotPreferredColumnsKey) {
          this.firstUse = false;
          this.displayedColumns = column.cols.map((item) => item.name);
        }
      });

      this.selectColumnsToShow();
    });
  }
}
