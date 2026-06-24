import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit,
  computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  type TnSortEvent,
} from '@truenas/ui-components';
import { Observable, of, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { TunableFormComponent } from 'app/pages/system/advanced/tunable/tunable-form/tunable-form.component';
import { tunableListElements } from 'app/pages/system/advanced/tunable/tunable-list/tunable-list.elements';

@Component({
  selector: 'ix-tunable-list',
  templateUrl: './tunable-list.component.html',
  styleUrls: ['./tunable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TunableFormComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class TunableListComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemTunableWrite];
  protected readonly searchableElements = tunableListElements;

  protected configOpen = signal(false);
  protected editingTunable = signal<Tunable | undefined>(undefined);
  protected configForm = viewChild(TunableFormComponent);

  protected readonly panelTitle = computed(() => {
    const tunable = this.editingTunable();
    if (!tunable) {
      return this.translate.instant('Add Tunable');
    }
    const type = tunable.type?.toUpperCase() || '';
    return this.translate.instant('Edit Tunable ({type})', { type });
  });

  dataProvider: AsyncDataProvider<Tunable>;
  searchQuery = signal('');
  tunables: Tunable[] = [];

  protected readonly displayedColumns = ['var', 'value', 'type', 'comment', 'enabled', 'actions'];

  protected readonly trackByTunableId = (_: number, row: Tunable): number => row.id;

  protected readonly actions: IconActionConfig<Tunable>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: Tunable): string {
    return convertStringToId('tunable-' + row.var + '-' + row.value);
  }

  protected ariaLabel(row: Tunable): string {
    return [row.var, this.translate.instant('Tunable')].join(' ');
  }

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  ngOnInit(): void {
    const tunables$ = this.api.call('tunable.query').pipe(
      tap((tunables) => this.tunables = tunables),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<Tunable>(tunables$);
    this.setDefaultSort();
    this.getTunables();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  private getTunables(): void {
    this.dataProvider.load();
  }

  protected doAdd(): void {
    this.editingTunable.set(undefined);
    this.configOpen.set(true);
  }

  protected doEdit(tunable: Tunable): void {
    this.editingTunable.set(tunable);
    this.configOpen.set(true);
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    this.editingTunable.set(undefined);
    if (saved) {
      this.getTunables();
    }
  }

  protected doDelete(tunable: Tunable): void {
    const type = tunable.type?.toUpperCase() || '';
    this.dialogService.confirmDelete({
      title: this.translate.instant('Delete Tunable ({type})', { type }),
      message: this.translate.instant('Are you sure you want to delete "{name}"?', { name: tunable.var }),
      job: () => this.api.job('tunable.delete', [tunable.id]),
      jobProgressTitle: this.translate.instant('Deleting...'),
      successMessage: this.translate.instant('Tunable "{name}" deleted', { name: tunable.var }),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getTunables());
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: ['var', 'value', 'comment'],
      preprocessMap: {
        var: (varName: string) => varName.split('_').join(' '),
      },
    });
    this.cdr.markForCheck();
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<Tunable>(event, this.displayedColumns));
  }

  protected setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'var',
    });
  }
}
