import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';
import {
  catchError, map, take,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { serviceNames } from 'app/enums/service-name.enum';
import { serviceStatusLabels } from 'app/enums/service-status.enum';
import { ServiceRow } from 'app/interfaces/service.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceActionsCellComponent } from 'app/pages/services/components/service-actions-cell/service-actions-cell.component';
import { ServiceStatusCellComponent } from 'app/pages/services/components/service-status-cell/service-status-cell.component';
import { servicesElements } from 'app/pages/services/services.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServicesService } from 'app/services/services.service';
import { serviceChanged } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { waitForServices } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BasicSearchComponent,
    MatCard,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    PageHeaderComponent,
    ServiceStatusCellComponent,
    TranslateModule,
    AsyncPipe,
    ServiceActionsCellComponent,
  ],
})
export class ServicesComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private servicesService = inject(ServicesService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<ServicesState>>(Store);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);

  protected readonly searchableElements = servicesElements;
  protected readonly requiredRoles = [Role.ServiceWrite];

  columns = createTable<ServiceRow>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    templateColumn({
      title: this.translate.instant('Status'),
      sortBy: (row) => row.state,
      propertyName: 'state',
    }),
    toggleColumn({
      title: this.translate.instant('Start Automatically'),
      propertyName: 'enable',
      onRowToggle: (row) => this.enableToggle(row),
      dynamicRequiredRoles: (row) => of(this.servicesService.getRolesRequiredToManage(row.service)),
    }),
    templateColumn({
      cssClass: 'actions-column',
    }),
  ], {
    uniqueRowTag: (row) => 'service-' + row.name.replace(/\./g, ''),
    ariaLabels: (row) => [row.name, this.translate.instant('Service')],
  });

  dataProvider = new ArrayDataProvider<ServiceRow>();
  filterString = '';
  services: ServiceRow[];
  protected readonly serviceStatusLabels = serviceStatusLabels;

  error = false;
  loading = true;

  protected get emptyConfig(): EmptyType {
    switch (true) {
      case this.loading:
        return EmptyType.Loading;
      case !!this.error:
        return EmptyType.Errors;
      case !this.services.length && !this.loading:
        return EmptyType.NoPageData;
      default:
        return EmptyType.NoSearchResults;
    }
  }

  ngOnInit(): void {
    this.getData();
  }

  protected onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({
      list: this.services,
      query,
      columnKeys: ['name'],
      preprocessMap: {
        name: (name: string) => name.replace(/\./g, ''),
      },
    });
  }

  private getData(): void {
    this.loading = true;
    this.error = false;

    this.store$.pipe(
      waitForServices,
      map((services) => services.map((service) => ({
        ...service,
        name: serviceNames.get(service.service) || service.service,
      }))),
      untilDestroyed(this),
    ).subscribe({
      next: (services) => {
        this.services = services;
        this.onListFiltered(this.filterString);
        this.loading = false;
        this.error = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private enableToggle(service: ServiceRow): void {
    this.store$.dispatch(serviceChanged({ service: { ...service, enable: !service.enable } }));

    this.api.call('service.update', [service.id, { enable: !service.enable }])
      .pipe(
        this.loader.withLoader(),
        take(1),
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(serviceChanged({ service }));
          return of(EMPTY);
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
