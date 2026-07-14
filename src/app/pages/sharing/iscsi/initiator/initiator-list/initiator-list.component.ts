import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker, TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective,
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent,
  TnTablePagerComponent, TnTestIdDirective, TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiInitiatorGroup } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { convertStringToId, createTable, mapTnSortToTableSort, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { initiatorListElements } from 'app/pages/sharing/iscsi/initiator/initiator-list/initiator-list.elements';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-iscsi-initiator-list',
  templateUrl: './initiator-list.component.html',
  styleUrls: ['./initiator-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTestIdDirective,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TnTooltipDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class InitiatorListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private iscsiService = inject(IscsiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = initiatorListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiInitiatorWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  protected readonly searchQuery = signal('');
  protected dataProvider: AsyncDataProvider<IscsiInitiatorGroup>;

  protected readonly actions: IconActionConfig<IscsiInitiatorGroup>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => {
        this.router.navigate(['/sharing', 'iscsi', 'initiators', 'edit', row.id]);
      },
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => {
        this.dialogService.confirmDelete({
          message: this.translate.instant('Are you sure you want to delete this item?'),
          call: () => this.api.call('iscsi.initiator.delete', [row.id]),
        }).pipe(
          takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => this.refresh());
      },
      requiredRoles: this.requiredRoles,
    },
  ];

  // ix-table column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs); tn-table renders cells from the template and
  // derives its `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<IscsiInitiatorGroup>([
    textColumn({
      title: this.translate.instant('Group ID'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Initiators'),
      propertyName: 'initiators',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    actionsWithMenuColumn({ actions: [] }),
  ]));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly trackByInitiatorId = (_index: number, row: IscsiInitiatorGroup): number => row.id;

  protected uniqueRowTag(row: IscsiInitiatorGroup): string {
    // Pre-split with lodash kebabCase so digit-bearing values resolve identically through
    // the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
    return kebabCase(convertStringToId(`iscsi-initiator-${row.id}`));
  }

  protected ariaLabel(row: IscsiInitiatorGroup): string {
    return [row.id.toString(), this.translate.instant('iSCSI Initiator')].join(' ');
  }

  protected formatInitiators(row: IscsiInitiatorGroup): string {
    return row?.initiators?.length ? row.initiators.join(' ') : this.translate.instant('Allow all initiators');
  }

  ngOnInit(): void {
    const initiators$ = this.iscsiService.getInitiators();

    this.iscsiService.listenForDataRefresh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dataProvider.load());

    this.dataProvider = new AsyncDataProvider(initiators$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected doAdd(): void {
    this.router.navigate(['/sharing', 'iscsi', 'initiators', 'add']);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<IscsiInitiatorGroup>(event, this.displayedColumns()));
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: ['comment', 'initiators'],
      preprocessMap: {
        initiators: (initiators: string[]) => initiators.join(' '),
      },
    });
  }

  protected onColumnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
