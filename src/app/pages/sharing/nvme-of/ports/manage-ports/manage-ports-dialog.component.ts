import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialog, TnDialogShellComponent, tnIconMarker } from '@truenas/ui-components';
import { filter, map, switchMap } from 'rxjs/operators';
import { nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort, PortOrHostDeleteDialogData, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
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
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface NvmeOfPortAndUsage extends NvmeOfPort {
  usedInSubsystems: number;
}

@Component({
  selector: 'ix-manage-ports-dialog',
  templateUrl: './manage-ports-dialog.component.html',
  styleUrl: './manage-ports-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
    IxTableBodyComponent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableEmptyDirective,
  ],
})
export class ManagePortsDialog implements OnInit {
  private nvmeOfStore = inject(NvmeOfStore);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private tnDialog = inject(TnDialog);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

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
          iconName: tnIconMarker('pencil', 'mdi'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: tnIconMarker('delete', 'mdi'),
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

  ngOnInit(): void {
    this.dataProvider.load();
  }

  onAdd(): void {
    this.formPanel
      .open(PortFormComponent, { title: this.translate.instant('Add Port') })
      .onSuccess(() => {
        this.snackbar.success(this.translate.instant('Port Added'));
        this.nvmeOfStore.reloadPorts();
      }, this.destroyRef);
  }

  onEdit(port: NvmeOfPort): void {
    this.formPanel
      .open(PortFormComponent, { title: this.translate.instant('Edit Port'), inputs: { port } })
      .onSuccess(() => {
        this.snackbar.success(this.translate.instant('Port Updated'));
        this.nvmeOfStore.reloadPorts();
      }, this.destroyRef);
  }

  onDelete(port: NvmeOfPortAndUsage): void {
    const name = port.addr_trsvcid ? `${port.addr_traddr}:${port.addr_trsvcid}` : port.addr_traddr;
    const subsystemsInUse = this.nvmeOfStore?.subsystems?.()
      .filter((subsystem) => subsystem.ports.some((subsystemPort) => subsystemPort.id === port.id)) || [];

    this.tnDialog.open(
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
      .closed
      .pipe(
        filter((data: { confirmed: boolean; force: boolean }) => !!data?.confirmed),
        switchMap(({ force }) => {
          return this.api.call('nvmet.port.delete', [port.id, { force }]).pipe(
            this.errorHandler.withErrorHandler(),
            this.loader.withLoader(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.nvmeOfStore.reloadPorts();
      });
  }
}
