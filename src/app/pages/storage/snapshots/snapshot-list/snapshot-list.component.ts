import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  Subject, BehaviorSubject, combineLatest, of, EMPTY, Observable,
} from 'rxjs';
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
import { SnapshotBatchDeleteDialogComponent } from 'app/pages/storage/snapshots/snapshot-batch-delete-dialog/snapshot-batch-delete-dialog.component';
import { SnapshotCloneDialogComponent } from 'app/pages/storage/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/storage/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { snapshotPageEntered } from 'app/pages/storage/snapshots/store/snapshot.actions';
import { selectSnapshotsTotal, SnapshotSlice } from 'app/pages/storage/snapshots/store/snapshot.selectors';
import {
  DialogService, ModalService, WebSocketService, AppLoaderService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SnapshotAddFormComponent } from '../snapshot-add-form/snapshot-add-form.component';
import { showExtraColumnsPressed } from '../store/snapshot.actions';
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
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  dataSource: MatTableDataSource<ZfsSnapshot> = new MatTableDataSource([]);
  defaultSort: Sort = { active: 'snapshot', direction: 'desc' };
  filterString = '';
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

  emptyOrErrorConfig$: Observable<EmptyConfig> = combineLatest([this.isEmpty$, this.error$]).pipe(
    switchMap(([isEmpty, isError]) => {
      if (isError) {
        return of(this.errorConfig);
      }
      if (isEmpty) {
        return of(this.emptyConfig);
      }
      return EMPTY;
    }),
  );

  get displayedColumns(): string[] {
    if (this.showExtraColumns$.value) {
      return ['select', 'dataset', 'snapshot', 'used', 'created', 'referenced', 'actions'];
    }
    return ['select', 'dataset', 'snapshot', 'actions'];
  }

  constructor(
    private dialogService: DialogService,
    private websocket: WebSocketService,
    private translate: TranslateService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
    private loader: AppLoaderService,
    private matDialog: MatDialog,
    private store$: Store<SnapshotSlice>,
    private slideIn: IxSlideInService,
  ) {
    if (window.localStorage.getItem('snapshotXtraCols') === 'true') {
      this.showExtraColumns$.next(true);
    }
  }

  ngOnInit(): void {
    this.store$.dispatch(snapshotPageEntered({ extra: this.showExtraColumns$.value }));
    this.setupToolbar();
    this.getSnapshots();
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

  createDataSource(snapshots: ZfsSnapshot[] = []): void {
    this.dataSource = new MatTableDataSource(snapshots);
    this.dataSource.sort = this.sort;
  }

  toggleExtraColumnsDialog(): void {
    this.showExtraColumns$.next(!this.showExtraColumns$.value);
    window.localStorage.setItem('snapshotXtraCols', this.showExtraColumns$.value.toString());
    if (this.showExtraColumns$.value) {
      this.store$.dispatch(snapshotPageEntered({ extra: true }));
    }
    this.getSnapshots();
    this.selection.clear();
    const slideToggleControl = this.toolbarConfig.controls.find((control) => control.name === 'extra-columns');
    slideToggleControl.confirmOptions = this.getConfirmOptions();
    this.cdr.markForCheck();
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
          this.store$.dispatch(showExtraColumnsPressed());
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
}
