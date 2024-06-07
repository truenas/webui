import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS } from '@angular/material/slide-toggle';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, of, switchMap,
} from 'rxjs';
import { BootEnvironmentAction } from 'app/enums/boot-environment-action.enum';
import { BootEnvironmentActive } from 'app/enums/boot-environment-active.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { Bootenv } from 'app/interfaces/bootenv.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { checkboxColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { sizeColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { BootPoolDeleteDialogComponent } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { bootListElements } from 'app/pages/system/bootenv/bootenv-list/bootenv-list.elements';
import { BootenvStatsDialogComponent } from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Exclude AnythingUi when NAS-127632 is done
interface BootenvUi extends Bootenv {
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
})
export class BootEnvironmentListComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = bootListElements;

  dataProvider: AsyncDataProvider<BootenvUi>;
  filterString = '';

  columns = createTable<BootenvUi>([
    checkboxColumn({
      propertyName: 'selected',
      onRowCheck: (row, checked) => {
        this.bootenvs.find((bootenv) => row.id === bootenv.id).selected = checked;
        this.dataProvider.setRows([]);
        this.dataProvider.setRows(this.bootenvs.filter(this.filterBootenv));
      },
      onColumnCheck: (checked) => {
        this.bootenvs.forEach((bootenv) => bootenv.selected = checked);
        this.dataProvider.setRows([]);
        this.dataProvider.setRows(this.bootenvs.filter(this.filterBootenv));
      },
      cssClass: 'checkboxs-column',
    }),
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Active'),
      propertyName: 'active',
      getValue: (row) => {
        switch (row.active) {
          case BootEnvironmentActive.Now:
            return this.translate.instant('Now');
          case BootEnvironmentActive.Reboot:
            return this.translate.instant('Reboot');
          case BootEnvironmentActive.NowReboot:
            return this.translate.instant('Now/Reboot');
          default:
            return row.active;
        }
      },
    }),
    dateColumn({
      title: this.translate.instant('Date Created'),
      propertyName: 'created',
      sortBy: (row) => row.created.$date,
    }),
    sizeColumn({
      title: this.translate.instant('Space'),
      propertyName: 'rawspace',
    }),
    yesNoColumn({
      title: this.translate.instant('Keep'),
      propertyName: 'keep',
      cssClass: 'keep-column',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'mdi-check-decagram',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Activate'),
          hidden: (row) => of(row.active.includes('R')),
          onClick: (row) => this.doActivate(row),
        },
        {
          iconName: 'mdi-content-copy',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Clone'),
          onClick: (row) => this.doClone(row),
        },
        {
          iconName: 'mdi-rename-box',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Rename'),
          onClick: (row) => this.doRename(row),
        },
        {
          iconName: 'bookmark',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Keep'),
          hidden: (row) => of(row.keep),
          onClick: (row) => this.toggleKeep(row),
        },
        {
          iconName: 'bookmark_border',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Unkeep'),
          hidden: (row) => of(!row.keep),
          onClick: (row) => this.toggleKeep(row),
        },
        {
          iconName: 'mdi-delete',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Delete'),
          hidden: (row) => of(![BootEnvironmentActive.Dash, BootEnvironmentActive.Empty].includes(row.active)),
          onClick: (row) => this.doDelete([row]),
        },
      ],
      cssClass: 'actions-column',
    }),
  ], {
    rowTestId: (row) => `bootenv-${row.name}`,
  });

  get selectedBootenvs(): BootenvUi[] {
    return this.bootenvs.filter(this.filterBootenv).filter((bootenv) => bootenv.selected);
  }

  get selectionHasItems(): boolean {
    return this.selectedBootenvs.some(
      (bootenv) => [BootEnvironmentActive.Dash, BootEnvironmentActive.Empty].includes(bootenv.active),
    );
  }

  private bootenvs: BootenvUi[] = [];

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const request$ = this.ws.call('bootenv.query').pipe(
      map((bootenvs) => {
        this.bootenvs = bootenvs.map((bootenv) => ({
          ...bootenv,
          selected: false,
        }));
        return this.bootenvs.filter(this.filterBootenv);
      }),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.refresh();
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.filterUpdated(this.filterString);
    });
  }

  handleSlideInClosed(slideInRef: IxSlideInRef<unknown>): void {
    slideInRef.slideInClosed$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.refresh());
  }

  openBootenvStats(): void {
    this.matDialog.open(BootenvStatsDialogComponent);
  }

  doRename(bootenv: Bootenv): void {
    const slideInRef = this.slideInService.open(BootEnvironmentFormComponent, {
      data: { operation: BootEnvironmentAction.Rename, name: bootenv.id },
    });
    this.handleSlideInClosed(slideInRef);
  }

  doClone(bootenv: Bootenv): void {
    const slideInRef = this.slideInService.open(BootEnvironmentFormComponent, {
      data: { operation: BootEnvironmentAction.Clone, name: bootenv.id },
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
        return this.ws.startJob('boot.scrub').pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
        );
      }),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Scrub Started'));
    });
  }

  doDelete(bootenvs: BootenvUi[]): void {
    bootenvs.forEach((bootenv) => delete bootenv.selected);
    this.matDialog.open(BootPoolDeleteDialogComponent, {
      data: bootenvs.filter(
        (bootenv) => [BootEnvironmentActive.Dash, BootEnvironmentActive.Empty].includes(bootenv.active),
      ),
    }).afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.refresh());
  }

  doActivate(bootenv: BootenvUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Activate'),
      message: this.translate.instant('Activate this Boot Environment?'),
      buttonText: helptextSystemBootenv.list_dialog_activate_action,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('bootenv.activate', [bootenv.id]).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
        );
      }),
      untilDestroyed(this),
    ).subscribe(() => this.refresh());
  }

  toggleKeep(bootenv: BootenvUi): void {
    if (!bootenv.keep) {
      this.dialogService.confirm({
        title: this.translate.instant('Keep'),
        message: this.translate.instant('Keep this Boot Environment?'),
        buttonText: this.translate.instant('Set Keep Flag'),
      }).pipe(
        filter(Boolean),
        switchMap(() => {
          return this.ws.call('bootenv.set_attribute', [bootenv.id, { keep: true }]).pipe(
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
          return this.ws.call('bootenv.set_attribute', [bootenv.id, { keep: false }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      ).subscribe(() => this.refresh());
    }
  }

  protected filterUpdated(query: string): void {
    this.filterString = query;
    this.dataProvider.setRows(this.bootenvs.filter(this.filterBootenv));
  }

  private filterBootenv = (bootenv: BootenvUi): boolean => {
    return bootenv.name.toLowerCase().includes(this.filterString.toLowerCase());
  };

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
