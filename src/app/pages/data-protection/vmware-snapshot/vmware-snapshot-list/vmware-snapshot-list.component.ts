import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, Type, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { translated } from 'app/helpers/translated.helper';
import { VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { detailActionTestId, tnTableListHost } from 'app/modules/tn-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { VmwareSnapshotFormComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-form/vmware-snapshot-form.component';
import { vmwareSnapshotListElements } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.elements';
import { VmwareStatusCellComponent } from './vmware-status-cell/vmware-status-cell.component';

@Component({
  selector: 'ix-vmware-snapshot-list',
  templateUrl: './vmware-snapshot-list.component.html',
  styleUrls: ['./vmware-snapshot-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    TnTablePagerComponent,
    TableTextCellComponent,
    VmwareStatusCellComponent,
    TranslateModule,
  ],
})
export class VmwareSnapshotListComponent implements OnInit {
  protected translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = vmwareSnapshotListElements;
  protected readonly requiredRoles = [Role.SnapshotTaskWrite];

  protected readonly searchQuery = signal('');

  private readonly snapshots$ = this.api.call('vmware.query').pipe(
    takeUntilDestroyed(),
  );

  readonly dataProvider = new AsyncDataProvider<VmwareSnapshot>(this.snapshots$);

  // One source of truth per column title: the header, the cell (whose test id is built
  // from it) and the column model all read the same entry, so a rename cannot silently
  // change a data-test value. `translated` re-runs it on a language change. (This list has no
  // column picker, so the titles are read only from the template and follow along directly.)
  protected readonly titles = translated(() => ({
    hostname: this.translate.instant('Hostname'),
    username: this.translate.instant('Username'),
    filesystem: this.translate.instant('Filesystem'),
    datastore: this.translate.instant('Datastore'),
    state: this.translate.instant('State'),
  }));

  protected readonly list = tnTableListHost<VmwareSnapshot>(this.dataProvider, {
    displayedColumns: [
      'hostname',
      'username',
      'filesystem',
      'datastore',
      // `state` is a nested object, so it needs an accessor to stay sortable.
      { name: 'state', sortBy: (row) => row.state?.state ?? '' },
    ],
  });

  protected readonly trackBySnapshotId = (_index: number, row: VmwareSnapshot): number => row.id;

  protected readonly uniqueRowTag = this.list.rowTag((row) => 'vmware-snapshot-' + row.hostname);

  protected detailActionTestId(row: VmwareSnapshot, action: string): string {
    return detailActionTestId([row.hostname, row.filesystem], action);
  }

  ngOnInit(): void {
    this.getSnapshotsData();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['hostname', 'datastore', 'filesystem', 'username'] });
  }

  private getSnapshotsData(): void {
    this.dataProvider.load();
  }

  // VmwareSnapshotFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly vmwareSnapshotForm = VmwareSnapshotFormComponent as unknown as Type<SidePanelForm>;

  protected doAdd(): void {
    this.formPanel.open(this.vmwareSnapshotForm, { title: this.translate.instant('Add VM Snapshot') })
      .onSuccess(() => this.getSnapshotsData(), this.destroyRef);
  }

  protected doEdit(snapshot: VmwareSnapshot): void {
    this.formPanel.open(this.vmwareSnapshotForm, {
      title: this.translate.instant('Edit VM Snapshot'),
      inputs: { snapshotToEdit: snapshot },
    }).onSuccess(() => this.getSnapshotsData(), this.destroyRef);
  }

  protected doDelete(snapshot: VmwareSnapshot): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete this snapshot?'),
      call: () => this.api.call('vmware.delete', [snapshot.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.getSnapshotsData();
    });
  }
}
