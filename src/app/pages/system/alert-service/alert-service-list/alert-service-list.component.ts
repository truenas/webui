import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, Type, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardHeaderActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  type TnSortEvent,
} from '@truenas/ui-components';
import { tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { alertLevelLabels } from 'app/enums/alert-level.enum';
import { alertServiceNames } from 'app/enums/alert-service-type.enum';
import { Role } from 'app/enums/role.enum';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { alertServiceListElements } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.elements';

@Component({
  selector: 'ix-alert-service-list',
  templateUrl: './alert-service-list.component.html',
  styleUrls: ['./alert-service-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderActionsDirective,
    UiSearchDirective,
    BasicSearchComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class AlertServiceListComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private loader = inject(LoaderService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AlertListWrite];
  protected readonly searchableElements = alertServiceListElements;

  protected dataProvider: AsyncDataProvider<AlertService>;
  protected searchQuery = signal('');

  protected readonly displayedColumns = ['name', 'type', 'level', 'enabled', 'actions'];

  protected readonly trackByServiceId = (_: number, row: AlertService): number => row.id;

  protected readonly actions: IconActionConfig<AlertService>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.editAlertService(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.confirmDeleteAlertService(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected serviceTypeLabel(service: AlertService): string {
    return this.translate.instant(
      alertServiceNames.find((alertService) => alertService.value === service.attributes.type)?.label || '',
    );
  }

  protected serviceLevelLabel(service: AlertService): string {
    if (service.level) {
      return this.translate.instant(alertLevelLabels.get(service.level) || service.level);
    }

    return this.translate.instant('Unknown');
  }

  protected uniqueRowTag(row: AlertService): string {
    return convertStringToId('alert-service-' + row.name);
  }

  protected ariaLabel(row: AlertService): string {
    return [row.name, this.translate.instant('Alert Service')].join(' ');
  }

  private alertServices: AlertService[] = [];

  ngOnInit(): void {
    const alertServices$ = this.api.call('alertservice.query').pipe(
      tap((alertServices) => this.alertServices = alertServices),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<AlertService>(alertServices$);
    this.setDefaultSort();
    this.getAlertServices();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<AlertService>(event, this.displayedColumns));
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  // AlertServiceComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles/footerActions) the panel reads; cast past the nominal base type,
  // mirroring how FormSidePanelService.openForm casts the renderer.
  private readonly alertServiceForm = AlertServiceComponent as unknown as Type<SidePanelForm>;

  protected addAlertService(): void {
    this.formPanel.open(this.alertServiceForm, { title: this.translate.instant('Add Alert Service') })
      .onSuccess(() => this.getAlertServices(), this.destroyRef);
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ list: this.alertServices, query, columnKeys: ['name', 'level'] });
    this.cdr.markForCheck();
  }

  private editAlertService(row: AlertService): void {
    this.formPanel.open(this.alertServiceForm, {
      title: this.translate.instant('Edit Alert Service'),
      inputs: { alertServiceToEdit: row },
    }).onSuccess(() => this.getAlertServices(), this.destroyRef);
  }

  private confirmDeleteAlertService(alertService: AlertService): void {
    this.dialogService.confirmDelete({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Alert Service <b>"{name}"</b>?', { name: alertService.name }),
      call: () => this.api.call('alertservice.delete', [alertService.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.getAlertServices());
  }

  private getAlertServices(): void {
    this.dataProvider.load();
  }
}
