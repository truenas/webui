import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, Type, inject, viewChild, signal,
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
  TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import {
  convertStringToId, dataProviderEmptyState, dataProviderLoading, dataProviderRows,
  detailActionTestId, mapTnSortToTableSort,
} from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
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
    TnTestIdDirective,
    VmwareStatusCellComponent,
    TnTablePagerComponent,
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
  protected readonly displayedColumns = ['hostname', 'username', 'filesystem', 'datastore', 'state'];

  protected readonly searchQuery = signal('');

  private snapshots: VmwareSnapshot[] = [];

  private readonly snapshots$ = this.api.call('vmware.query').pipe(
    tap((snapshots) => this.snapshots = snapshots),
    takeUntilDestroyed(),
  );

  readonly dataProvider = new AsyncDataProvider<VmwareSnapshot>(this.snapshots$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly empty = dataProviderEmptyState(this.dataProvider);

  protected readonly trackBySnapshotId = (_index: number, row: VmwareSnapshot): number => row.id;

  protected uniqueRowTag(row: VmwareSnapshot): string {
    // Pre-split with lodash kebabCase: it breaks letter–digit boundaries ('esxi1' → 'esxi-1')
    // while the library's kebab does not, so the tag resolves identically through the legacy
    // [ixTest] directive and the library [tnTestId] directive.
    return kebabCase(convertStringToId('vmware-snapshot-' + row.hostname));
  }

  protected ariaLabel(row: VmwareSnapshot): string {
    return [row.hostname, this.translate.instant('VMware Snapshot')].join(' ');
  }

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

  private readonly table = viewChild(TnTableComponent<VmwareSnapshot>);

  /**
   * tn-table only expands through its chevron; the ix-table this replaced expanded on a
   * row click too, so drive the expansion from `(rowClick)` to keep that behaviour.
   */
  protected onRowClick(row: VmwareSnapshot): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<VmwareSnapshot>(event, this.displayedColumns));
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
