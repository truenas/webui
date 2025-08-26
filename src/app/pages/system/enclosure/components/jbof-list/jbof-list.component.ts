import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
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
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof-form.component';
import { jbofListElements } from 'app/pages/system/enclosure/components/jbof-list/jbof-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-jbof-list',
  templateUrl: './jbof-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    FormsModule,
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
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private emptyService = inject(EmptyService);
  private loader = inject(LoaderService);

  protected readonly requiredRoles = [Role.JbofWrite];
  protected readonly searchableElements = jbofListElements;

  filterString = signal('');
  jbofs: Jbof[] = [];
  protected canAddJbof = signal(false);

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

  protected get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  ngOnInit(): void {
    const request$ = this.api.call('jbof.query').pipe(
      tap((jbofs) => this.jbofs = jbofs),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.getJbofs();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString());
    });
  }

  protected openForm(jbof?: Jbof): void {
    this.slideIn.open(JbofFormComponent, { data: jbof }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getJbofs());
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
      untilDestroyed(this),
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
    ]).pipe(untilDestroyed(this)).subscribe(([jbofsLength, licensedLength]) => {
      this.canAddJbof.set(licensedLength > jbofsLength);
    });
  }

  protected onListFiltered(query: string): void {
    this.filterString.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['mgmt_username', 'description'] });
  }
}
