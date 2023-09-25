import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, catchError, filter, switchMap, tap,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { VmwareSnapshotFormComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-form/vmware-snapshot-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './vmware-snapshot-list.component.html',
  styleUrls: ['./vmware-snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VmwareSnapshotListComponent implements OnInit {
  private filterString = '';

  protected snapshots: VmwareSnapshot[] = [];
  dataProvider = new ArrayDataProvider<VmwareSnapshot>();
  columns = createTable<VmwareSnapshot>([
    textColumn({
      title: this.translate.instant('Hostname'),
      propertyName: 'hostname',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Filesystem'),
      propertyName: 'filesystem',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Datastore'),
      propertyName: 'datastore',
      sortable: true,
    }),
  ]);

  isLoading = false;
  emptyType = EmptyType.Loading;

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
    private emptyService: EmptyService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.getSnapshotsData();
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    if (!this.snapshots.length) {
      this.emptyType = EmptyType.NoPageData;
      return;
    }
    if (this.filterString === '') {
      this.dataProvider.setRows(this.snapshots);
      this.cdr.markForCheck();
      return;
    }
    const searchedRows = this.snapshots.filter((snapshot) => {
      return snapshot.hostname.toLowerCase().includes(this.filterString)
      || snapshot.datastore.toLowerCase().includes(this.filterString)
      || snapshot.filesystem.toLowerCase().includes(this.filterString)
      || snapshot.username.toLowerCase().includes(this.filterString);
    });
    if (!searchedRows.length) {
      this.emptyType = EmptyType.NoSearchResults;
    }
    this.dataProvider.setRows(searchedRows);
    this.cdr.markForCheck();
  }

  getSnapshotsData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.ws.call('vmware.query').pipe(
      tap((snapshots) => {
        this.snapshots = snapshots;
        if (!snapshots.length) {
          this.emptyType = EmptyType.NoPageData;
        }
        this.dataProvider.setRows(snapshots);
        this.cdr.markForCheck();
      }),
      catchError((error: WebsocketError) => {
        this.emptyType = EmptyType.Errors;
        this.dialogService.error(
          this.errorHandler.parseError(error),
        );
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(VmwareSnapshotFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.getSnapshotsData());
  }

  doEdit(snapshot: VmwareSnapshot): void {
    const slideInRef = this.slideInService.open(VmwareSnapshotFormComponent, { data: snapshot });
    slideInRef.slideInClosed$.pipe(
      untilDestroyed(this),
    ).subscribe(() => this.getSnapshotsData());
  }

  doDelete(snapshot: VmwareSnapshot): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete this snapshot?'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('vmware.delete', [snapshot.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getSnapshotsData();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }
}
