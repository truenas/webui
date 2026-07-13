import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnDialog, TnDialogShellComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, tnIconMarker,
} from '@truenas/ui-components';
import { filter, map, switchMap } from 'rxjs/operators';
import { nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort, PortOrHostDeleteDialogData, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
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
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TableActionsCellComponent,
  ],
})
export class ManagePortsDialog implements OnInit {
  private nvmeOfStore = inject(NvmeOfStore);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private tnDialog = inject(TnDialog);
  private formPanel = inject(FormSidePanelService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected readonly displayedColumns = ['addr_trtype', 'addr_traddr', 'addr_trsvcid', 'usedInSubsystems', 'actions'];

  protected readonly trackByPortId = (_: number, row: NvmeOfPortAndUsage): number => row.id;

  protected readonly actions: IconActionConfig<NvmeOfPortAndUsage>[] = [
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
  ];

  protected transportLabel(row: NvmeOfPortAndUsage): string {
    return this.translate.instant(nvmeOfTransportTypeLabels.get(row.addr_trtype) ?? row.addr_trtype);
  }

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
    // The side panel mounts on document.body and paints on top of this dialog's backdrop,
    // so the dialog can stay open behind it (no need to close it first as the slide-in did).
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
