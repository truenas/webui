import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, of, switchMap,
  take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { BootEnvironment } from 'app/interfaces/boot-environment.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { checkboxColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { sizeColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { BootPoolDeleteDialogComponent } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { bootListElements } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.elements';
import { BootenvStatsDialogComponent } from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

// TODO: Exclude AnythingUi when NAS-127632 is done
interface BootEnvironmentUi extends BootEnvironment {
  selected: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-bootenv-list',
  templateUrl: './bootenv-list.component.html',
  styleUrls: ['./bootenv-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS, useValue: { disableToggleValue: true } },
  ],
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    RouterLink,
    IxIconComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class BootEnvironmentListComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = bootListElements;
  protected dataProvider: AsyncDataProvider<BootEnvironmentUi>;
  protected readonly filterString = signal('');
  private bootenvs: BootEnvironmentUi[] = [];

  columns = createTable<BootEnvironmentUi>([
    checkboxColumn({
      propertyName: 'selected',
      onRowCheck: (row, checked) => {
        this.bootenvs.find((bootenv) => row.id === bootenv.id).selected = checked;
        this.dataProvider.setRows([]);
        this.onListFiltered(this.filterString());
      },
      onColumnCheck: (checked) => {
        this.dataProvider.currentPage$.pipe(
          take(1),
          untilDestroyed(this),
        ).subscribe((bootEnvs) => {
          bootEnvs.forEach((bootEnv) => bootEnv.selected = checked);
          this.dataProvider.setRows([]);
          this.onListFiltered(this.filterString());
        });
      },
      cssClass: 'checkboxs-column',
    }),
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'id',
    }),
    textColumn({
      title: this.translate.instant('Active'),
      propertyName: 'active',
      getValue: (row) => {
        if (row.active) {
          return this.translate.instant('Now');
        }
        if (row.activated) {
          return this.translate.instant('Restart');
        }
        return this.translate.instant('No');
      },
    }),
    dateColumn({
      title: this.translate.instant('Date Created'),
      propertyName: 'created',
      sortBy: (row) => row.created.$date,
    }),
    sizeColumn({
      title: this.translate.instant('Used Space'),
      propertyName: 'used_bytes',
    }),
    yesNoColumn({
      title: this.translate.instant('Keep'),
      propertyName: 'keep',
      cssClass: 'keep-column',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('mdi-check-decagram'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Activate'),
          hidden: (row) => of(!row.can_activate || row.activated),
          onClick: (row) => this.doActivate(row),
        },
        {
          iconName: iconMarker('bookmark'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Keep'),
          hidden: (row) => of(row.keep),
          onClick: (row) => this.toggleKeep(row),
        },
        {
          iconName: iconMarker('bookmark_border'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Unkeep'),
          hidden: (row) => of(!row.keep),
          onClick: (row) => this.toggleKeep(row),
        },
        {
          iconName: iconMarker('mdi-content-copy'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Clone'),
          onClick: (row) => this.doClone(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Delete'),
          hidden: (row) => of(row.active || row.activated),
          onClick: (row) => this.doDelete([row]),
        },
      ],
      cssClass: 'actions-column',
    }),
  ], {
    uniqueRowTag: (row) => `bootenv-${row.id}`,
    ariaLabels: (row) => [row.id, this.translate.instant('Boot Environment')],
  });

  get selectedBootenvs(): BootEnvironmentUi[] {
    return this.bootenvs.filter((bootenv) => bootenv.selected);
  }

  get selectionHasItems(): boolean {
    return this.selectedBootenvs.some((bootenv) => !bootenv.active && !bootenv.activated);
  }

  constructor(
    private api: ApiService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private slideInService: SlideInService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const request$ = this.api.call('boot.environment.query').pipe(
      map((bootenvs) => {
        this.bootenvs = bootenvs.map((bootenv) => ({
          ...bootenv,
          selected: false,
        }));
        return this.bootenvs;
      }),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.refresh();
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString());
    });
  }

  handleSlideInClosed(slideInRef: SlideInRef<unknown>): void {
    slideInRef.slideInClosed$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.refresh());
  }

  openBootenvStats(): void {
    this.matDialog.open(BootenvStatsDialogComponent);
  }

  doClone(bootenv: BootEnvironment): void {
    const slideInRef = this.slideInService.open(BootEnvironmentFormComponent, {
      data: bootenv.id,
    });
    this.handleSlideInClosed(slideInRef);
  }

  doScrub(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Scrub'),
      message: this.translate.instant('Start the scrub now?'),
      buttonText: this.translate.instant('Start Scrub'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.startJob('boot.scrub').pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
        );
      }),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Scrub Started'));
    });
  }

  doDelete(bootenvs: BootEnvironmentUi[]): void {
    bootenvs.forEach((bootenv) => delete bootenv.selected);
    const data = bootenvs.filter((bootenv) => !bootenv.active && !bootenv.activated);
    this.matDialog.open(BootPoolDeleteDialogComponent, { data })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }

  doActivate(bootenv: BootEnvironmentUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Activate'),
      message: this.translate.instant('Activate this Boot Environment?'),
      buttonText: helptextSystemBootenv.list_dialog_activate_action,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.call('boot.environment.activate', [{ id: bootenv.id }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
        );
      }),
      untilDestroyed(this),
    ).subscribe(() => this.refresh());
  }

  toggleKeep(bootenv: BootEnvironmentUi): void {
    if (!bootenv.keep) {
      this.dialogService.confirm({
        title: this.translate.instant('Keep'),
        message: this.translate.instant('Keep this Boot Environment?'),
        buttonText: this.translate.instant('Set Keep Flag'),
      }).pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('boot.environment.keep', [{ id: bootenv.id, value: true }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      ).subscribe(() => this.refresh());
    } else {
      this.dialogService.confirm({
        title: this.translate.instant('Unkeep'),
        message: this.translate.instant('No longer keep this Boot Environment?'),
        buttonText: this.translate.instant('Remove Keep Flag'),
      }).pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('boot.environment.keep', [{ id: bootenv.id, value: false }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      ).subscribe(() => this.refresh());
    }
  }

  protected onListFiltered(query: string): void {
    this.filterString.set(query);
    this.dataProvider.setFilter({ list: this.bootenvs, query, columnKeys: ['id'] });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 3,
      direction: SortDirection.Desc,
      propertyName: 'created',
      sortBy: (row) => row.created.$date,
    });
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
