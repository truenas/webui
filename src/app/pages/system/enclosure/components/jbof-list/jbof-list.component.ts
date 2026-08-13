import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnSortEvent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  tnIconMarker,
} from '@truenas/ui-components';
import {
  filter, forkJoin, map, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { Jbof } from 'app/interfaces/jbof.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { mapTnSortToTableSort, toUniqueRowTag } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getJbofFormConfig } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof.form-config';
import { jbofListElements } from 'app/pages/system/enclosure/components/jbof-list/jbof-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-jbof-list',
  templateUrl: './jbof-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTooltipDirective,
    UiSearchDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTestIdDirective,
    TableActionsCellComponent,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class JbofListComponent implements OnInit {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.JbofWrite];
  protected readonly searchableElements = jbofListElements;

  searchQuery = signal('');
  jbofs: Jbof[] = [];
  protected canAddJbof = signal(false);

  dataProvider: AsyncDataProvider<Jbof>;

  protected readonly displayedColumns = ['description', 'ips', 'mgmt_username', 'actions'];

  protected readonly actions: IconActionConfig<Jbof>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => this.doDelete(row),
    },
  ];

  protected readonly trackByJbofId = (_: number, row: Jbof): number => row.id;

  protected uniqueRowTag(row: Jbof): string {
    return toUniqueRowTag('jbof-' + row.mgmt_username);
  }

  protected ariaLabel(row: Jbof): string {
    return [row.mgmt_username, this.translate.instant('JBOF')].join(' ');
  }

  protected formatIps(row: Jbof): string {
    return [row.mgmt_ip1, row.mgmt_ip2].filter(Boolean).join(', ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<Jbof>(event, this.displayedColumns));
  }

  ngOnInit(): void {
    const request$ = this.api.call('jbof.query').pipe(
      tap((jbofs) => this.jbofs = jbofs),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.getJbofs();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected openForm(jbof?: Jbof): void {
    this.formPanel.openForm(getJbofFormConfig(this.api, this.translate, jbof), {
      title: jbof
        ? this.translate.instant('Edit Expansion Shelf')
        : this.translate.instant('Add Expansion Shelf'),
      ...(jbof ? { editData: jbof } : {}),
    }).onSuccess(() => this.getJbofs(), this.destroyRef);
  }

  protected doDelete(jbof: Jbof): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Are you sure you want to delete this item?'),
      hideCheckbox: true,
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant('Force'),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
    }).pipe(
      filter((confirmation: DialogWithSecondaryCheckboxResult) => confirmation.confirmed),
      switchMap((confirmation: DialogWithSecondaryCheckboxResult) => {
        const force = confirmation.secondaryCheckbox;

        return this.api.call('jbof.delete', [jbof.id, force]).pipe(this.loader.withLoader());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.getJbofs(),
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private getJbofs(): void {
    this.dataProvider.load();
    this.updateAvailableJbof();
  }

  updateAvailableJbof(): void {
    forkJoin([
      this.api.call('jbof.query').pipe(map((jbofs) => jbofs.length)),
      this.api.call('jbof.licensed'),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([jbofsLength, licensedLength]) => {
      this.canAddJbof.set(licensedLength > jbofsLength);
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['mgmt_username', 'description'] });
  }
}
