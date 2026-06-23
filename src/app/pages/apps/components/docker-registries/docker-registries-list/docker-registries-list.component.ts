import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnHeaderCellDefDirective, TnIconButtonComponent,
  TnSidePanelActionDirective, TnSidePanelComponent,
  TnSortEvent, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { dockerHubRegistry, DockerRegistry } from 'app/interfaces/docker-registry.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { createTable, mapTnSortToProviderSorting } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { dockerRegistriesListElements } from 'app/pages/apps/components/docker-registries/docker-registries-list/docker-registries-list.elements';
import { DockerRegistryFormComponent } from 'app/pages/apps/components/docker-registries/docker-registry-form/docker-registry-form.component';

@Component({
  selector: 'ix-docker-registries-list',
  templateUrl: './docker-registries-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    TnTablePagerComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    DockerRegistryFormComponent,
    BasicSearchComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class DockerRegistriesListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private unsavedChanges = inject(UnsavedChangesService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = dockerRegistriesListElements;

  dataProvider: AsyncDataProvider<DockerRegistry>;
  searchQuery = signal('');
  protected isLoggedIntoDockerHub = signal(false);

  protected readonly registryFormOpen = signal(false);
  protected readonly editingRegistry = signal<DockerRegistry | undefined>(undefined);
  protected readonly registryForm = viewChild(DockerRegistryFormComponent);
  protected readonly registryFormTitle = computed(() => (this.editingRegistry()
    ? this.translate.instant('Edit Docker Registry')
    : this.translate.instant('Create Docker Registry')));

  protected readonly registryCloseGuard = (): Observable<boolean> => {
    return this.registryForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  // Column-config model consumed by ix-table-columns-selector. The tn-table body
  // renders its own column templates; we derive its displayedColumns from the
  // selector's visibility state below.
  columns = createTable<DockerRegistry>([
    textColumn({ title: this.translate.instant('Name'), propertyName: 'name' }),
    textColumn({ title: this.translate.instant('Username'), propertyName: 'username' }),
    textColumn({ title: this.translate.instant('URI'), propertyName: 'uri' }),
  ], {
    uniqueRowTag: (row) => `docker-registry-${row.uri}-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Docker Registry')],
  });

  protected readonly visibleColumns = signal(this.getVisibleColumns(this.columns));
  protected readonly displayedColumns = computed(() => [...this.visibleColumns(), 'actions']);

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(
      this.api.call('app.registry.query').pipe(
        tap((registries) => {
          this.isLoggedIntoDockerHub.set(
            registries.some((registry) => registry.uri.includes(dockerHubRegistry)),
          );
        }),
      ),
    );
    this.dataProvider.load();
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.visibleColumns.set(this.getVisibleColumns(this.columns));
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: ['name', 'username', 'uri'],
    });
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToProviderSorting<DockerRegistry>(event));
  }

  protected onAdd(): void {
    this.editingRegistry.set(undefined);
    this.registryFormOpen.set(true);
  }

  protected onEdit(row: DockerRegistry): void {
    this.editingRegistry.set(row);
    this.registryFormOpen.set(true);
  }

  protected onRegistryFormClosed(saved: boolean): void {
    this.registryFormOpen.set(false);
    if (saved) {
      this.dataProvider.load();
    }
  }

  protected onDelete(row: DockerRegistry): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Delete Docker Registry'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> registry?', {
        name: `${row.name} (${row.uri})`,
      }),
      call: () => this.api.call('app.registry.delete', [row.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.dataProvider.load());
  }

  private getVisibleColumns(columns: typeof this.columns): string[] {
    return columns
      .filter((column) => !column.hidden && column.propertyName)
      .map((column) => column.propertyName as string);
  }
}
