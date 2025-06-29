import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { IdmapName } from 'app/enums/idmap.enum';
import { Role } from 'app/enums/role.enum';
import { helptextIdmap } from 'app/helptext/directory-service/idmap';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapFormComponent } from 'app/pages/directory-service/components/idmap-form/idmap-form.component';
import { idMapElements } from 'app/pages/directory-service/components/idmap-list/idmap-list.elements';
import { IdmapRow } from 'app/pages/directory-service/components/idmap-list/idmap-row.interface';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { IdmapService } from 'app/services/idmap.service';

@UntilDestroy()
@Component({
  selector: 'ix-idmap-list',
  templateUrl: './idmap-list.component.html',
  styleUrls: ['./idmap-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    RouterLink,
    MatToolbarRow,
    IxIconComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class IdmapListComponent implements OnInit {
  readonly paginator = input(true);
  readonly inCard = input(false);

  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = idMapElements;

  filterString = '';
  dataProvider: AsyncDataProvider<IdmapRow>;
  idmaps: IdmapRow[] = [];
  columns = createTable<IdmapRow>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'label',
    }),
    textColumn({
      title: this.translate.instant('Backend'),
      propertyName: 'idmap_backend',
    }),
    textColumn({
      title: this.translate.instant('DNS Domain Name'),
      propertyName: 'dns_domain_name',
    }),
    textColumn({
      title: this.translate.instant('Range Low'),
      propertyName: 'range_low',
    }),
    textColumn({
      title: this.translate.instant('Range High'),
      propertyName: 'range_high',
    }),
    textColumn({
      title: this.translate.instant('Certificate'),
      propertyName: 'cert_name',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => {
            this.slideIn.open(IdmapFormComponent, { data: row }).pipe(
              filter((response) => !!response.response),
              untilDestroyed(this),
            ).subscribe(() => this.getIdmaps());
          },
        },
        {
          iconName: iconMarker('mdi-delete'),
          hidden: (row) => of(requiredIdmapDomains.includes(row.name as IdmapName)),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translate.instant('Confirm'),
              message: this.translate.instant('Are you sure you want to delete this record?'),
              hideCheckbox: true,
            }).pipe(
              filter(Boolean),
              switchMap(() => this.api.call('idmap.delete', [row.id])),
              untilDestroyed(this),
            ).subscribe({
              error: (error: unknown) => {
                this.errorHandler.showErrorModal(error);
              },
              complete: () => {
                this.getIdmaps();
              },
            });
          },
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'idmap-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Idmap')],
  });

  constructor(
    private translate: TranslateService,
    private api: ApiService,
    protected idmapService: IdmapService,
    protected dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    protected emptyService: EmptyService,
    private slideIn: SlideIn,
  ) { }

  ngOnInit(): void {
    const idmapsRows$ = this.api.call('directoryservices.get_state').pipe(
      switchMap((state) => {
        if (state.ldap !== DirectoryServiceState.Disabled) {
          return this.api.call('idmap.query', [[['name', '=', IdmapName.DsTypeLdap]]]);
        }
        if (state.activedirectory !== DirectoryServiceState.Disabled) {
          return this.api.call('idmap.query', [[['name', '!=', IdmapName.DsTypeLdap]]]);
        }
        return this.api.call('idmap.query');
      }),
      map((idmaps) => {
        const transformed = [...idmaps] as IdmapRow[];
        transformed.forEach((row) => {
          if (row.certificate) {
            row.cert_name = row.certificate.cert_name;
          }
          row.label = row.name;
          const index = helptextIdmap.idmap.name.options.findIndex((option) => option.value === row.name);
          if (index >= 0) {
            row.label = helptextIdmap.idmap.name.options[index].label;
          }
        });
        return transformed;
      }),
      tap((idmapsRows) => this.idmaps = idmapsRows),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<IdmapRow>(idmapsRows$);
    this.setDefaultSort();
    this.getIdmaps();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  getIdmaps(): void {
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'label',
    });
  }

  doAdd(): void {
    this.idmapService.getActiveDirectoryStatus()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((adConfig) => {
        if (adConfig.enable) {
          this.slideIn.open(IdmapFormComponent).pipe(
            filter((response) => !!response.response),
            untilDestroyed(this),
          ).subscribe(() => {
            this.getIdmaps();
          });
        } else {
          this.dialogService.confirm({
            title: this.translate.instant(helptextIdmap.idmap.enableAdDialog.title),
            message: this.translate.instant(helptextIdmap.idmap.enableAdDialog.message),
            hideCheckbox: true,
            buttonText: this.translate.instant(helptextIdmap.idmap.enableAdDialog.button),
          }).pipe(
            filter(Boolean),
            untilDestroyed(this),
          ).subscribe({ next: () => this.showActiveDirectoryForm() });
        }
      });
  }

  private showActiveDirectoryForm(): void {
    this.slideIn.open(ActiveDirectoryComponent, { wide: true }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe({ next: () => this.getIdmaps() });
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({ query, columnKeys: ['label', 'idmap_backend'] });
  }
}
