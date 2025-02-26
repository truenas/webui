import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { dockerHubRegistry, DockerRegistry } from 'app/interfaces/docker-registry.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { dockerRegistriesListElements } from 'app/pages/apps/components/docker-registries/docker-registries-list/docker-registries-list.elements';
import { DockerRegistryFormComponent } from 'app/pages/apps/components/docker-registries/docker-registry-form/docker-registry-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-registries-list',
  templateUrl: './docker-registries-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    SearchInput1Component,
    TranslateModule,
    AsyncPipe,
  ],
})
export class DockerRegistriesListComponent implements OnInit {
  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = dockerRegistriesListElements;

  dataProvider: AsyncDataProvider<DockerRegistry>;
  filterString = '';
  protected isLoggedIntoDockerHub = signal(false);

  columns = createTable<DockerRegistry>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
    textColumn({
      title: this.translate.instant('URI'),
      propertyName: 'uri',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.onDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => `docker-registry-${row.uri}-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Docker Registry')],
  });

  constructor(
    protected emptyService: EmptyService,
    private translate: TranslateService,
    private api: ApiService,
    private slideIn: SlideIn,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) {}

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
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  protected onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({
      query,
      columnKeys: ['name', 'username', 'uri'],
    });
  }

  protected onAdd(): void {
    this.slideIn.open(DockerRegistryFormComponent, {
      data: { isLoggedInToDockerHub: this.isLoggedIntoDockerHub() },
    })
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private onEdit(row: DockerRegistry): void {
    this.slideIn.open(DockerRegistryFormComponent, {
      data: { registry: row, isLoggedInToDockerHub: this.isLoggedIntoDockerHub() },
    })
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private onDelete(row: DockerRegistry): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Docker Registry'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> registry?', {
        name: `${row.name} (${row.uri})`,
      }),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('app.registry.delete', [row.id]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => this.dataProvider.load());
  }
}
