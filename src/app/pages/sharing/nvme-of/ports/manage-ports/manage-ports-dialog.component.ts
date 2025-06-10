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
import { nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort, PortOrHostDeleteDialogData, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface NvmeOfPortAndUsage extends NvmeOfPort {
  usedInSubsystems: number;
}

@UntilDestroy()
@Component({
  selector: 'ix-manage-ports-dialog',
  templateUrl: './manage-ports-dialog.component.html',
  styleUrl: './manage-ports-dialog.component.scss',
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
export class ManagePortsDialog implements OnInit {
  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected columns = createTable<NvmeOfPortAndUsage>([
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'addr_trtype',
      getValue: (row) => {
        return this.translate.instant(nvmeOfTransportTypeLabels.get(row.addr_trtype) ?? row.addr_trtype);
      },
    }),
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'addr_traddr',
    }),
    textColumn({
      title: this.translate.instant('Port'),
      propertyName: 'addr_trsvcid',
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
    uniqueRowTag: (row) => `port-${row.addr_trtype}-${row.addr_traddr}-${row.addr_trsvcid}`,
    ariaLabels: (row) => [String(row.id), this.translate.instant('Port')],
  });

  protected dataProvider = new AsyncDataProvider(
    this.nvmeOfStore.state$.pipe(
      map((state) => {
        return state.ports.map((port) => ({
          ...port,
          usedInSubsystems: state.subsystems
            .filter((subsystem) => subsystem.ports.some((subsystemPort) => subsystemPort === port.id))
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
      .open(PortFormComponent)
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Port Added'));
        this.nvmeOfStore.reloadPorts();
      });
  }

  onEdit(port: NvmeOfPort): void {
    this.slideIn.open(PortFormComponent, { data: port })
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Port Updated'));
        this.nvmeOfStore.reloadPorts();
      });
  }

  onDelete(port: NvmeOfPortAndUsage): void {
    const name = port.addr_trsvcid ? `${port.addr_traddr}:${port.addr_trsvcid}` : port.addr_traddr;
    const subsystemsInUse = this.nvmeOfStore?.subsystems?.()
      .filter((subsystem) => subsystem.ports.some((subsystemPort) => subsystemPort.id === port.id)) || [];

    this.matDialog.open(
      SubsystemPortOrHostDeleteDialogComponent,
      {
        data: {
          type: PortOrHostDeleteType.Port,
          item: port,
          name,
          subsystemsInUse,
        } as PortOrHostDeleteDialogData,
        minWidth: '500px',
      },
    )
      .afterClosed()
      .pipe(
        filter((data: { confirmed: boolean; force: boolean }) => !!data?.confirmed),
        switchMap(({ force }) => {
          return this.api.call('nvmet.port.delete', [port.id, { force }]).pipe(
            this.errorHandler.withErrorHandler(),
            this.loader.withLoader(),
          );
        }),
        untilDestroyed(this),
      ).subscribe(() => {
        this.nvmeOfStore.reloadPorts();
      });
  }
}
