import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatCard } from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';
import {
  catchError, map, take,
} from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { AuditService } from 'app/enums/audit.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { Service, ServiceRow } from 'app/interfaces/service.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmartComponent } from 'app/pages/services/components/service-smart/service-smart.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import {
  ServiceStateColumnComponent,
} from 'app/pages/services/components/service-state-column/service-state-column.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { servicesElements } from 'app/pages/services/services.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { ServicesService } from 'app/services/services.service';
import { SlideInService } from 'app/services/slide-in.service';
import { UrlOptionsService } from 'app/services/url-options.service';
import { WebSocketService } from 'app/services/ws.service';
import { serviceChanged } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { waitForServices } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-services',
  templateUrl: './services.component.html',
  providers: [IscsiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SearchInput1Component,
    MatCard,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    AsyncPipe,
    PageHeaderComponent,
  ],
})
export class ServicesComponent implements OnInit {
  protected readonly searchableElements = servicesElements;

  columns = createTable<ServiceRow>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    {
      type: ServiceStateColumnComponent,
      title: this.translate.instant('Running'),
    },
    toggleColumn({
      title: this.translate.instant('Start Automatically'),
      propertyName: 'enable',
      onRowToggle: (row) => this.enableToggle(row),
      dynamicRequiredRoles: (row) => of(this.servicesService.getRolesRequiredToManage(row.service)),
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('receipt_long'),
          tooltip: this.translate.instant('Audit Logs'),
          hidden: (row) => of(!this.hasLogs(row.service)),
          onClick: () => this.router.navigate([this.auditLogsUrl()]),
        },
        {
          iconName: iconMarker('list'),
          dynamicTooltip: (row) => of(this.translate.instant('{name} Sessions', { name: serviceNames.get(row.service) })),
          hidden: (row) => of(!this.hasSessions(row.service)),
          onClick: (row) => this.router.navigate(this.sessionsUrl(row.service)),
        },
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.configureService(row),
          dynamicRequiredRoles: (row) => of(this.servicesService.getRolesRequiredToManage(row.service)),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'service-' + row.name.replace(/\./g, ''),
    ariaLabels: (row) => [row.name, this.translate.instant('Service')],
  });

  dataProvider = new ArrayDataProvider<ServiceRow>();
  filterString = '';
  services: ServiceRow[];

  error = false;
  loading = true;

  get emptyConfig(): EmptyType {
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

  constructor(
    protected emptyService: EmptyService,
    private servicesService: ServicesService,
    private ws: WebSocketService,
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private slideInService: SlideInService,
    private store$: Store<ServicesState>,
    private urlOptions: UrlOptionsService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
  ) {}

  ngOnInit(): void {
    this.getData();
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
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
        name: serviceNames.has(service.service) ? serviceNames.get(service.service) : service.service,
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

    this.ws.call('service.update', [service.id, { enable: !service.enable }])
      .pipe(
        this.loader.withLoader(),
        take(1),
        catchError((error) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(serviceChanged({ service }));
          return of(EMPTY);
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private configureService(row: Service): void {
    switch (row.service) {
      case ServiceName.Iscsi:
        this.router.navigate(['/sharing', 'iscsi']);
        break;
      case ServiceName.Ftp:
        this.slideInService.open(ServiceFtpComponent, { wide: true });
        break;
      case ServiceName.Nfs:
        this.slideInService.open(ServiceNfsComponent, { wide: true });
        break;
      case ServiceName.Snmp:
        this.slideInService.open(ServiceSnmpComponent, { wide: true });
        break;
      case ServiceName.Ups:
        this.slideInService.open(ServiceUpsComponent, { wide: true });
        break;
      case ServiceName.Ssh:
        this.slideInService.open(ServiceSshComponent);
        break;
      case ServiceName.Cifs:
        this.slideInService.open(ServiceSmbComponent);
        break;
      case ServiceName.Smart:
        this.slideInService.open(ServiceSmartComponent);
        break;
      default:
        break;
    }
  }

  private sessionsUrl(serviceName: ServiceName): string[] {
    if (serviceName === ServiceName.Cifs) {
      return ['/sharing', 'smb', 'status', 'sessions'];
    }
    if (serviceName === ServiceName.Nfs) {
      return ['/sharing', 'nfs', 'sessions'];
    }
    return [];
  }

  private hasSessions(serviceName: ServiceName): boolean {
    return serviceName === ServiceName.Cifs || serviceName === ServiceName.Nfs;
  }

  private auditLogsUrl(): string {
    return this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['service', '=', AuditService.Smb]],
      },
    });
  }

  private hasLogs(serviceName: ServiceName): boolean {
    return serviceName === ServiceName.Cifs;
  }
}
