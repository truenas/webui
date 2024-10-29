import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { alertLevelLabels } from 'app/enums/alert-level.enum';
import { alertServiceNames } from 'app/enums/alert-service-type.enum';
import { Role } from 'app/enums/role.enum';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { alertServiceListElements } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-alert-service-list',
  templateUrl: './alert-service-list.component.html',
  styleUrls: ['./alert-service-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    SearchInput1Component,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AlertServiceListComponent implements OnInit {
  readonly requiredRoles = [Role.AlertListWrite];
  protected readonly searchableElements = alertServiceListElements;

  dataProvider: AsyncDataProvider<AlertService>;
  filterString = '';

  columns = createTable<AlertService>([
    textColumn({
      title: this.translate.instant('Service Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'type',
      getValue: (service) => this.translate.instant(
        alertServiceNames.find((alertService) => alertService.value === service.type).label,
      ),
    }),
    textColumn({
      title: this.translate.instant('Level'),
      propertyName: 'level',
      getValue: (service) => this.translate.instant(alertLevelLabels.get(service.level)),
    }),
    textColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      getValue: (service) => (service.enabled ? this.translate.instant('Yes') : this.translate.instant('No')),
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.editAlertService(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.confirmDeleteAlertService(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => `disk-${row.name}`,
    ariaLabels: (row) => [row.name, this.translate.instant('Disk')],
  });

  private alertServices: AlertService[] = [];

  constructor(
    protected emptyService: EmptyService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private slideInService: SlideInService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const alertServices$ = this.ws.call('alertservice.query').pipe(
      tap((alertServices) => this.alertServices = alertServices),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<AlertService>(alertServices$);
    this.getAlertServices();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  addAlertService(): void {
    const slideInRef = this.slideInService.open(AlertServiceComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getAlertServices());
  }

  protected onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({ list: this.alertServices, query, columnKeys: ['name', 'type', 'level'] });
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private editAlertService(row: AlertService): void {
    const slideInRef = this.slideInService.open(AlertServiceComponent, { data: row });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getAlertServices());
  }

  private confirmDeleteAlertService(alertService: AlertService): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Alert Service <b>"{name}"</b>?', {
        name: alertService.name,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('alertservice.delete', [alertService.id])),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => this.getAlertServices());
  }

  private getAlertServices(): void {
    this.dataProvider.load();
  }
}
