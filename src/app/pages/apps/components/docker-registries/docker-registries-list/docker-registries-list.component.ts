import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnHeaderCellDefDirective, TnIconButtonComponent,
  TnSortEvent, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent,
} from '@truenas/ui-components';
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
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable, mapTnSortToProviderSorting, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { dockerRegistriesListElements } from 'app/pages/apps/components/docker-registries/docker-registries-list/docker-registries-list.elements';
import { DockerRegistryFormComponent } from 'app/pages/apps/components/docker-registries/docker-registry-form/docker-registry-form.component';

@Component({
  selector: 'ix-docker-registries-list',
  templateUrl: './docker-registries-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    TnTablePagerComponent,
    BasicSearchComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class DockerRegistriesListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = dockerRegistriesListElements;

  dataProvider: AsyncDataProvider<DockerRegistry>;
  searchQuery = signal('');
  protected isLoggedIntoDockerHub = signal(false);

  // Column-config model consumed by ix-table-column-picker. The tn-table body
  // renders its own column templates; we derive its displayedColumns from the
  // picker's visibility state below.
  protected readonly columns = signal(createTable<DockerRegistry>([
    textColumn({ title: this.translate.instant('Name'), propertyName: 'name' }),
    textColumn({ title: this.translate.instant('Username'), propertyName: 'username' }),
    textColumn({ title: this.translate.instant('URI'), propertyName: 'uri' }),
  ], {
    uniqueRowTag: (row) => `docker-registry-${row.uri}-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Docker Registry')],
  }));

  // The actions column lives only in the template, so it is appended here rather
  // than declared in `columns` (and stays out of the picker as a result).
  protected readonly displayedColumns = computed(() => [...toDisplayedColumns(this.columns()), 'actions']);

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

  protected onColumnsChange(columns: Column<DockerRegistry, ColumnComponent<DockerRegistry>>[]): void {
    this.columns.set([...columns]);
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
    this.formPanel.open(DockerRegistryFormComponent, {
      title: this.translate.instant('Create Docker Registry'),
      testId: 'docker-registry',
      inputs: { isLoggedInToDockerHub: this.isLoggedIntoDockerHub() },
    }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  protected onEdit(row: DockerRegistry): void {
    this.formPanel.open(DockerRegistryFormComponent, {
      title: this.translate.instant('Edit Docker Registry'),
      testId: 'docker-registry',
      inputs: { registry: row, isLoggedInToDockerHub: this.isLoggedIntoDockerHub() },
    }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
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
}
