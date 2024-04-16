import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { VmwareSnapshotFormComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-form/vmware-snapshot-form.component';
import { vmwareSnapshotListElements } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.elements';
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
  protected readonly searchableElements = vmwareSnapshotListElements;
  readonly requiredRoles = [Role.FullAdmin];

  filterString = '';

  protected snapshots: VmwareSnapshot[] = [];
  dataProvider: AsyncDataProvider<VmwareSnapshot>;
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
    textColumn({
      title: this.translate.instant('State'),
      propertyName: 'state',
      sortable: true,
    }),
  ], {
    rowTestId: (row) => 'vmware-snapshot-' + row.hostname,
  });

  constructor(
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
    protected emptyService: EmptyService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    const snapshots$ = this.ws.call('vmware.query').pipe(
      tap((snapshots) => this.snapshots = snapshots),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<VmwareSnapshot>(snapshots$);
    this.getSnapshotsData();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.snapshots.filter((snapshot) => {
      return snapshot.hostname.toLowerCase().includes(this.filterString)
      || snapshot.datastore.toLowerCase().includes(this.filterString)
      || snapshot.filesystem.toLowerCase().includes(this.filterString)
      || snapshot.username.toLowerCase().includes(this.filterString);
    }));
  }

  getSnapshotsData(): void {
    this.dataProvider.load();
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(VmwareSnapshotFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getSnapshotsData());
  }

  doEdit(snapshot: VmwareSnapshot): void {
    const slideInRef = this.slideInService.open(VmwareSnapshotFormComponent, { data: snapshot });
    slideInRef.slideInClosed$.pipe(
      filter(Boolean),
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
