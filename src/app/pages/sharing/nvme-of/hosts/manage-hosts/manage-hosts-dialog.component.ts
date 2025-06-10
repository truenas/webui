import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatDialog, MatDialogClose, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { NvmeOfHost, PortOrHostDeleteDialogData, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface NvmeOfHostAndUsage extends NvmeOfHost {
  usedInSubsystems: number;
}

@UntilDestroy()
@Component({
  selector: 'ix-manage-hosts-dialog',
  templateUrl: './manage-hosts-dialog.component.html',
  styleUrl: './manage-hosts-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatButton,
    MatDialogContent,
    MatDialogTitle,
    MatIconButton,
    TranslateModule,
    TestDirective,
    MatDialogClose,
    AsyncPipe,
    IxTableBodyComponent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableEmptyDirective,
  ],
})
export class ManageHostsDialog implements OnInit {
  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected columns = createTable<NvmeOfHostAndUsage>([
    textColumn({
      title: this.translate.instant('NQN'),
      propertyName: 'hostnqn',
    }),
    yesNoColumn({
      title: this.translate.instant('Has Host Authentication'),
      propertyName: 'dhchap_key',
    }),
    textColumn({
      title: this.translate.instant('Used In Subsystems'),
      propertyName: 'usedInSubsystems',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.onDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => `host-${row.hostnqn}`,
    ariaLabels: (row) => [String(row.id), this.translate.instant('Host')],
  });

  protected dataProvider = new AsyncDataProvider(
    this.nvmeOfStore.state$.pipe(
      map((state) => {
        return state.hosts.map((host) => ({
          ...host,
          usedInSubsystems: state.subsystems
            .filter((subsystem) => subsystem.hosts.some((subsystemHost) => subsystemHost === host.id))
            .length,
        }));
      }),
    ),
  );

  constructor(
    private nvmeOfStore: NvmeOfStore,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private slideIn: SlideIn,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: LoaderService,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.dataProvider.load();
  }

  onAdd(): void {
    this.slideIn
      .open(HostFormComponent)
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Host Added'));
        this.nvmeOfStore.reloadHosts();
      });
  }

  onEdit(host: NvmeOfHostAndUsage): void {
    this.slideIn.open(HostFormComponent, { data: host })
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Host Updated'));
        this.nvmeOfStore.reloadHosts();
      });
  }

  onDelete(host: NvmeOfHostAndUsage): void {
    const subsystemsInUse = this.nvmeOfStore?.subsystems?.()
      .filter((subsystem) => subsystem.hosts.some((subSystemHost) => subSystemHost.id === host.id)) || [];

    this.matDialog.open(
      SubsystemPortOrHostDeleteDialogComponent,
      {
        data: {
          type: PortOrHostDeleteType.Host,
          item: host,
          name: host.hostnqn,
          subsystemsInUse,
        } as PortOrHostDeleteDialogData,
        minWidth: '500px',
      },
    )
      .afterClosed()
      .pipe(
        filter((data: { confirmed: boolean; force: boolean }) => !!data?.confirmed),
        switchMap(({ force }) => {
          return this.api.call('nvmet.host.delete', [host.id, { force }]).pipe(
            this.errorHandler.withErrorHandler(),
            this.loader.withLoader(),
          );
        }),
        untilDestroyed(this),
      ).subscribe(() => {
        this.nvmeOfStore.reloadHosts();
      });
  }
}
