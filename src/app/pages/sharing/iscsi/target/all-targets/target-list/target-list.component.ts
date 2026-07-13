import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective, TnCellDefDirective,
  TnHeaderCellDefDirective, TnIconButtonComponent, TnTableColumnDirective, TnTableComponent,
  TnTablePagerComponent, TnTestIdDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { targetListElements } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.elements';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';

@Component({
  selector: 'ix-iscsi-target-list',
  templateUrl: './target-list.component.html',
  styleUrls: ['./target-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTestIdDirective,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class TargetListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly toggleShowMobileDetails = output<boolean>();
  readonly dataProvider = input.required<AsyncDataProvider<IscsiTarget>>();
  readonly targets = input<IscsiTarget[]>();

  protected readonly searchableElements = targetListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  searchQuery = signal('');

  // The Mode column only appears once a non-iSCSI (FC-capable) target exists.
  protected readonly displayedColumns = computed<string[]>(() => {
    const columns = ['name', 'alias'];
    if (this.targets()?.some((target) => target.mode !== IscsiTargetMode.Iscsi)) {
      columns.push('mode');
    }
    columns.push('actions');
    return columns;
  });

  protected readonly trackByTargetId = (_index: number, row: IscsiTarget): number => row.id;

  protected uniqueRowTag(row: IscsiTarget): string {
    // Pre-split with lodash kebabCase so digit-bearing values resolve identically through
    // the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
    return kebabCase(convertStringToId('iscsi-target-' + row.name));
  }

  protected modeLabel(row: IscsiTarget): string {
    return this.translate.instant(iscsiTargetModeNames.get(row.mode) || row.mode) || '-';
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.dataProvider().load();
    this.dataProvider().emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected onRowClick(row: IscsiTarget): void {
    const isCurrentlyExpanded = this.dataProvider().expandedRow === row;
    if (isCurrentlyExpanded) {
      this.expanded(null);
    } else {
      this.dataProvider().expandedRow = row;
      this.expanded(row);
    }
  }

  private expanded(target: IscsiTarget | null): void {
    this.toggleShowMobileDetails.emit(!!target);
    if (!target) {
      this.dataProvider().expandedRow = null;
      this.cdr.markForCheck();
    }
  }

  private setDefaultSort(): void {
    this.dataProvider().setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider().setSorting(mapTnSortToTableSort<IscsiTarget>(event, this.displayedColumns()));
  }

  protected doAdd(): void {
    // The created target's expand + reload is driven by `iscsiService.refreshData(...)` (emitted
    // from the form's onSuccess) which `all-targets` listens for and reloads the shared
    // dataProvider — so no explicit reload here (it would double-load).
    this.formPanel.open(TargetFormComponent, {
      title: this.translate.instant('Add ISCSI Target'),
      wide: true,
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider().setFilter({ query, columnKeys: ['name'] });
  }
}
