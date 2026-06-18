import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal, DestroyRef, computed, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCellDefDirective, TnHeaderCellDefDirective, TnSidePanelActionDirective,
  TnSidePanelComponent, TnSlideToggleComponent, TnTableColumnDirective, TnTableComponent, TnTestIdDirective,
  TnTooltipDirective, type TnSortEvent,
} from '@truenas/ui-components';
import { EMPTY, Observable, of } from 'rxjs';
import {
  catchError, map, take,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { serviceNames, ServiceName } from 'app/enums/service-name.enum';
import { serviceStatusLabels } from 'app/enums/service-status.enum';
import { Service, ServiceRow } from 'app/interfaces/service.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceActionsCellComponent } from 'app/pages/services/components/service-actions-cell/service-actions-cell.component';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceStatusCellComponent } from 'app/pages/services/components/service-status-cell/service-status-cell.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { ServiceWebshareComponent } from 'app/pages/services/components/service-webshare/service-webshare.component';
import { servicesElements } from 'app/pages/services/services.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServicesService } from 'app/services/services.service';
import { serviceChanged } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { waitForServices } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BasicSearchComponent,
    TnCardComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnSlideToggleComponent,
    TnButtonComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TnTestIdDirective,
    TnTooltipDirective,
    RequiresRolesDirective,
    UiSearchDirective,
    PageHeaderComponent,
    ServiceStatusCellComponent,
    ServiceActionsCellComponent,
    ServiceFtpComponent,
    ServiceNfsComponent,
    ServiceSmbComponent,
    ServiceSnmpComponent,
    ServiceSshComponent,
    ServiceUpsComponent,
    ServiceWebshareComponent,
    TranslateModule,
    AsyncPipe,
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
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = servicesElements;
  protected readonly requiredRoles = [Role.ServiceWrite];
  protected readonly ServiceName = ServiceName;

  protected readonly displayedColumns = ['name', 'state', 'enable', 'actions'];

  dataProvider = new ArrayDataProvider<ServiceRow>();
  searchQuery = signal('');
  services: ServiceRow[];
  protected readonly serviceStatusLabels = serviceStatusLabels;

  error = false;
  loading = true;

  // The config form is hosted in a single side panel; only one service form is
  // rendered at a time, selected by `configService`.
  protected readonly configOpen = signal(false);
  protected readonly configService = signal<ServiceName | null>(null);

  // Two-column forms need a wider panel (matches the legacy SlideIn `wide` width).
  private readonly wideConfigServices = new Set<ServiceName>([
    ServiceName.Ftp,
    ServiceName.Nfs,
    ServiceName.Snmp,
    ServiceName.Ups,
  ]);

  private ftpForm = viewChild(ServiceFtpComponent);
  private nfsForm = viewChild(ServiceNfsComponent);
  private smbForm = viewChild(ServiceSmbComponent);
  private snmpForm = viewChild(ServiceSnmpComponent);
  private sshForm = viewChild(ServiceSshComponent);
  private upsForm = viewChild(ServiceUpsComponent);
  private webshareForm = viewChild(ServiceWebshareComponent);

  protected readonly configForm = computed<SidePanelForm | undefined>(() => {
    return this.ftpForm() ?? this.nfsForm() ?? this.smbForm() ?? this.snmpForm()
      ?? this.sshForm() ?? this.upsForm() ?? this.webshareForm();
  });

  protected readonly configTitle = computed<string>(() => {
    const service = this.configService();
    return service ? (serviceNames.get(service) ?? service) : '';
  });

  protected readonly configPanelWidth = computed<string>(() => {
    const service = this.configService();
    return service && this.wideConfigServices.has(service) ? '800px' : '480px';
  });

  protected readonly closeConfigGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

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

  protected readonly trackByServiceId = (_index: number, row: ServiceRow): number => row.id;

  protected uniqueRowTag(row: ServiceRow): string {
    return 'service-' + row.name.replace(/\./g, '');
  }

  protected rolesToManage(row: ServiceRow): Role[] {
    return this.servicesService.getRolesRequiredToManage(row.service);
  }

  protected emptyMessage(): string {
    return this.translate.instant(this.emptyService.defaultEmptyConfig(this.emptyConfig).title);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<ServiceRow>(event, this.displayedColumns));
  }

  protected openConfig(service: Service): void {
    this.configService.set(service.service);
    this.configOpen.set(true);
  }

  protected onConfigClosed(): void {
    this.configOpen.set(false);
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (services) => {
        this.services = services;
        this.onListFiltered(this.searchQuery());
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

  protected enableToggle(service: ServiceRow): void {
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
