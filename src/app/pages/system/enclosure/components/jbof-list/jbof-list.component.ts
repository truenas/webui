import { AsyncPipe } from '@angular/common';
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof-form.component';
import { jbofListElements } from 'app/pages/system/enclosure/components/jbof-list/jbof-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-jbof-list',
  templateUrl: './jbof-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatTooltip,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class JbofListComponent implements OnInit {
  protected readonly requiredRoles = [Role.JbofWrite];
  protected readonly searchableElements = jbofListElements;

  filterString = '';
  jbofs: Jbof[] = [];
  canAddJbof = false;

  dataProvider: AsyncDataProvider<Jbof>;
  columns = createTable<Jbof>([
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('IPs'),
      getValue: (row) => [row.mgmt_ip1, row.mgmt_ip2].filter(Boolean).join(', '),
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'mgmt_username',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'jbof-' + row.mgmt_username,
    ariaLabels: (row) => [row.mgmt_username, this.translate.instant('JBOF')],
  });

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private ws: WebSocketService,
    private slideInService: SlideInService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private emptyService: EmptyService,
    private loader: AppLoaderService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const request$ = this.ws.call('jbof.query').pipe(
      tap((jbofs) => this.jbofs = jbofs),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.getJbofs();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  openForm(jbof?: Jbof): void {
    const slideInRef = this.slideInService.open(JbofFormComponent, { data: jbof });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.getJbofs());
  }

  doDelete(jbof: Jbof): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Are you sure you want to delete this item?'),
      hideCheckbox: true,
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant('Force'),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'red',
    }).pipe(
      filter((confirmation: DialogWithSecondaryCheckboxResult) => confirmation.confirmed),
      switchMap((confirmation: DialogWithSecondaryCheckboxResult) => {
        const force = confirmation.secondaryCheckbox;

        return this.ws.call('jbof.delete', [jbof.id, force]).pipe(this.loader.withLoader());
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => this.getJbofs(),
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  getJbofs(): void {
    this.dataProvider.load();
    this.updateAvailableJbof();
  }

  updateAvailableJbof(): void {
    forkJoin([
      this.ws.call('jbof.query').pipe(map((jbofs) => jbofs.length)),
      this.ws.call('jbof.licensed'),
    ]).pipe(untilDestroyed(this)).subscribe(([jbofsLength, licensedLength]) => {
      this.canAddJbof = licensedLength > jbofsLength;
      this.cdr.markForCheck();
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({ query, columnKeys: ['mgmt_username', 'description'] });
  }
}
