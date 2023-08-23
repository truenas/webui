import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { BehaviorSubject, Observable, combineLatest, filter, map, of, switchMap } from 'rxjs';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { IdmapName } from 'app/enums/idmap.enum';
import helptext from 'app/helptext/directory-service/idmap';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapFormComponent } from 'app/pages/directory-service/components/idmap-form/idmap-form.component';
import { IdmapRow } from 'app/pages/directory-service/components/idmap-list/idmap-row.interface';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IdmapService } from 'app/services/idmap.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-idmaps-list',
  templateUrl: './idmap-list.component.html',
  styleUrls: ['./idmap-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class IdmapListComponent implements OnInit {
  @Input() paginator = true;
  @Input() toolbar = false;
  requiredIdmapDomains = requiredIdmapDomains as string[];
  IdmapName = IdmapName;
  filterString = '';
  dataProvider = new ArrayDataProvider<IdmapRow>();
  idmaps: IdmapRow[] = [];
  columns = createTable<IdmapRow>([
    textColumn({
      title: this.translateService.instant('Name'),
      propertyName: 'label',
      sortable: true,
    }),
    textColumn({
      title: this.translateService.instant('Backend'),
      propertyName: 'idmap_backend',
      sortable: true,
    }),
    textColumn({
      title: this.translateService.instant('DNS Domain Name'),
      propertyName: 'dns_domain_name',
      sortable: true,
    }),
    textColumn({
      title: this.translateService.instant('Range Low'),
      propertyName: 'range_low',
      sortable: true,
    }),
    textColumn({
      title: this.translateService.instant('Range High'),
      propertyName: 'range_high',
      sortable: true,
    }),
    textColumn({
      title: this.translateService.instant('Certificate'),
      propertyName: 'cert_name',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translateService.instant('Edit'),
          onClick: (row) => {
            const slideInRef = this.slideInService.open(IdmapFormComponent, { data: row });
            slideInRef.slideInClosed$.pipe(
              untilDestroyed(this),
            ).subscribe(() => this.getIdmaps());
          },
        },
        {
          iconName: 'delete',
          hidden: (row) => {
            return of(requiredIdmapDomains.includes(row.name as IdmapName));
          },
          tooltip: this.translateService.instant('Delete'),
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translateService.instant('Confirm'),
              message: this.translateService.instant('Are you sure you want to delete this record?'),
              hideCheckbox: true,
            }).pipe(
              filter(Boolean),
              switchMap(() => this.ws.call('idmap.delete', [row.id])),
              untilDestroyed(this),
            ).subscribe({
              error: (error: WebsocketError) => {
                this.dialogService.error(this.errorHandler.parseWsError(error));
              },
              complete: () => {
                this.getIdmaps();
              },
            });
          },
        },
      ],
    }),
  ]);


  isLoading$ = new BehaviorSubject<boolean>(true);
  isNoData$ = new BehaviorSubject<boolean>(false);
  hasError$ = new BehaviorSubject<boolean>(false);
  emptyType$: Observable<EmptyType> = combineLatest([this.isLoading$, this.isNoData$, this.hasError$]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );

  constructor(
    private translateService: TranslateService,
    private ws: WebSocketService,
    protected idmapService: IdmapService,
    protected dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    protected emptyService: EmptyService,
    private slideInService: IxSlideInService,
  ) { }

  ngOnInit(): void {
    this.getIdmaps();
  }

  getIdmaps(): void {
    this.ws.call('directoryservices.get_state').pipe(
      switchMap((state) => {
        if (state.ldap !== DirectoryServiceState.Disabled) {
          return this.ws.call('idmap.query', [[['name', '=', IdmapName.DsTypeLdap]]]);
        } else if (state.activedirectory !== DirectoryServiceState.Disabled) {
          return this.ws.call('idmap.query', [[['name', '!=', IdmapName.DsTypeLdap]]]);
        } else {
          return this.ws.call('idmap.query');
        }
      }),
      map((idmaps) => {
        const transformed = [...idmaps] as IdmapRow[];
        transformed.forEach((row) => {
          if (row.certificate) {
            row.cert_name = row.certificate.cert_name;
          }
          if (row.name === IdmapName.DsTypeActiveDirectory && row.idmap_backend === 'AUTORID') {
            const obj = transformed.find((idmapRow) => idmapRow.name === IdmapName.DsTypeDefaultDomain);
            obj.disableEdit = true;
          }
          row.label = row.name;
          const index = helptext.idmap.name.options.findIndex((option) => option.value === row.name);
          if (index >= 0) {
            row.label = helptext.idmap.name.options[index].label;
          }
        });
        return transformed;
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (idmapsRows) => {
        this.idmaps = idmapsRows;
        this.dataProvider.setRows(idmapsRows);
        this.isLoading$.next(false);
        this.isNoData$.next(!idmapsRows.length);
        this.setDefaultSort();
        this.cdr.markForCheck();
      },
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'label',
    });
  }

  doAdd(): void {
    this.idmapService.getActiveDirectoryStatus().pipe(untilDestroyed(this)).subscribe((adConfig) => {
      if (adConfig.enable) {
        const slideInRef = this.slideInService.open(IdmapFormComponent);
        slideInRef.slideInClosed$.pipe(
          untilDestroyed(this),
        ).subscribe(() => {
          this.getIdmaps();
        });
      } else {
        this.dialogService.confirm({
          title: helptext.idmap.enable_ad_dialog.title,
          message: helptext.idmap.enable_ad_dialog.message,
          hideCheckbox: true,
          buttonText: helptext.idmap.enable_ad_dialog.button,
        }).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe({ next: () => this.showActiveDirectoryForm() });
      }
    });
  }

  showActiveDirectoryForm(): void {
    const slideInRef = this.slideInService.open(ActiveDirectoryComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(
      untilDestroyed(this),
    ).subscribe({ next: () => this.getIdmaps() });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.idmaps.filter((idmap) => {
      return _.find(idmap, query);
    }));
  }
}