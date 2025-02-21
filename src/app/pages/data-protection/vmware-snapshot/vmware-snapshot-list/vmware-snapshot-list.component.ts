import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { VmwareSnapshotFormComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-form/vmware-snapshot-form.component';
import { vmwareSnapshotListElements } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { VmwareStatusCellComponent } from './vmware-status-cell/vmware-status-cell.component';

@UntilDestroy()
@Component({
  selector: 'ix-vmware-snapshot-list',
  templateUrl: './vmware-snapshot-list.component.html',
  styleUrls: ['./vmware-snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    IxTableComponent,
    UiSearchDirective,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    VmwareStatusCellComponent,
    IxTableDetailsRowDirective,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class VmwareSnapshotListComponent implements OnInit {
  protected readonly searchableElements = vmwareSnapshotListElements;
  protected readonly requiredRoles = [Role.SnapshotTaskWrite];

  filterString = '';

  protected snapshots: VmwareSnapshot[] = [];
  dataProvider: AsyncDataProvider<VmwareSnapshot>;
  columns = createTable<VmwareSnapshot>([
    textColumn({
      title: this.translate.instant('Hostname'),
      propertyName: 'hostname',
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
    textColumn({
      title: this.translate.instant('Filesystem'),
      propertyName: 'filesystem',
    }),
    textColumn({
      title: this.translate.instant('Datastore'),
      propertyName: 'datastore',
    }),
    textColumn({
      title: this.translate.instant('State'),
      propertyName: 'state',
    }),
  ], {
    uniqueRowTag: (row) => 'vmware-snapshot-' + row.hostname,
    ariaLabels: (row) => [row.hostname, this.translate.instant('VMware Snapshot')],
  });

  constructor(
    protected translate: TranslateService,
    private slideIn: SlideIn,
    protected emptyService: EmptyService,
    private api: ApiService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    const snapshots$ = this.api.call('vmware.query').pipe(
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
    this.filterString = query;
    this.dataProvider.setFilter({ query, columnKeys: ['hostname', 'datastore', 'filesystem', 'username'] });
  }

  getSnapshotsData(): void {
    this.dataProvider.load();
  }

  doAdd(): void {
    this.slideIn.open(VmwareSnapshotFormComponent).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getSnapshotsData());
  }

  doEdit(snapshot: VmwareSnapshot): void {
    this.slideIn.open(VmwareSnapshotFormComponent, { data: snapshot }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getSnapshotsData());
  }

  doDelete(snapshot: VmwareSnapshot): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete this snapshot?'),
      hideCheckbox: true,
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('vmware.delete', [snapshot.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getSnapshotsData();
      },
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }
}
