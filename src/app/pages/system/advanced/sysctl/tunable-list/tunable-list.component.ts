import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { tunableListElements } from 'app/pages/system/advanced/sysctl/tunable-list/tunable-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-tunable-list',
  templateUrl: './tunable-list.component.html',
  styleUrls: ['./tunable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    UiSearchDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class TunableListComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemTunableWrite];
  protected readonly searchableElements = tunableListElements;

  dataProvider: AsyncDataProvider<Tunable>;
  filterString = '';
  tunables: Tunable[] = [];
  columns = createTable<Tunable>([
    textColumn({
      title: this.translate.instant('Variable'),
      propertyName: 'var',
    }),
    textColumn({
      title: this.translate.instant('Value'),
      propertyName: 'value',
    }),
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'type',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'tunable-' + row.var + '-' + row.value,
    ariaLabels: (row) => [row.var, this.translate.instant('Tunable')],
  });

  constructor(
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
    private snackbar: SnackbarService,
    private slideIn: SlideIn,
  ) {}

  ngOnInit(): void {
    const tunables$ = this.api.call('tunable.query').pipe(
      tap((tunables) => this.tunables = tunables),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<Tunable>(tunables$);
    this.setDefaultSort();
    this.getTunables();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  getTunables(): void {
    this.dataProvider.load();
  }

  doAdd(): void {
    this.slideIn.open(TunableFormComponent).pipe(
      filter((response) => !!response.response),
      tap(() => this.getTunables()),
      untilDestroyed(this),
    ).subscribe();
  }

  doEdit(tunable: Tunable): void {
    this.slideIn.open(TunableFormComponent, { data: tunable }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getTunables();
    });
  }

  doDelete(tunable: Tunable): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Delete Sysctl'),
        message: this.translate.instant('Are you sure you want to delete "{name}"?', { name: tunable.var }),
        buttonText: this.translate.instant('Delete'),
        buttonColor: 'warn',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.dialogService.jobDialog(
            this.api.job('tunable.delete', [tunable.id]),
            {
              title: this.translate.instant('Deleting...'),
            },
          )
            .afterClosed()
            .pipe(
              tap(() => {
                this.getTunables();
                this.snackbar.success(this.translate.instant('Sysctl "{name}" deleted', { name: tunable.var }));
              }),
              this.errorHandler.catchError(),
            );
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider.setFilter({
      query,
      columnKeys: ['var', 'value', 'comment'],
      preprocessMap: {
        var: (varName: string) => varName.split('_').join(' '),
      },
    });
    this.cdr.markForCheck();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'var',
    });
  }
}
