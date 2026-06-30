import { DialogRef } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCellDefDirective, TnDialog, TnDialogShellComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, tnIconMarker,
} from '@truenas/ui-components';
import { filter, map, switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { NvmeOfHost, PortOrHostDeleteDialogData, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface NvmeOfHostAndUsage extends NvmeOfHost {
  usedInSubsystems: number;
}

export const enum ManageHostsAction {
  Add = 'add',
  Edit = 'edit',
}

export interface ManageHostsResult {
  action: ManageHostsAction;
  host?: NvmeOfHost;
}

@Component({
  selector: 'ix-manage-hosts-dialog',
  templateUrl: './manage-hosts-dialog.component.html',
  styleUrl: './manage-hosts-dialog.component.scss',
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
export class ManageHostsDialog implements OnInit {
  private nvmeOfStore = inject(NvmeOfStore);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private tnDialog = inject(TnDialog);
  private dialogRef = inject<DialogRef<ManageHostsResult>>(DialogRef);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected readonly displayedColumns = ['hostnqn', 'description', 'dhchap_key', 'usedInSubsystems', 'actions'];

  protected readonly trackByHostId = (_: number, row: NvmeOfHostAndUsage): number => row.id;

  protected readonly actions: IconActionConfig<NvmeOfHostAndUsage>[] = [
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

  ngOnInit(): void {
    this.dataProvider.load();
  }

  onAdd(): void {
    // Close the dialog and let the host open the host form in a side panel.
    this.dialogRef.close({ action: ManageHostsAction.Add });
  }

  onEdit(host: NvmeOfHostAndUsage): void {
    // Close the dialog and let the host open the host form in a side panel.
    this.dialogRef.close({ action: ManageHostsAction.Edit, host });
  }

  onDelete(host: NvmeOfHostAndUsage): void {
    const subsystemsInUse = this.nvmeOfStore?.subsystems?.()
      .filter((subsystem) => subsystem.hosts.some((subSystemHost) => subSystemHost.id === host.id)) || [];

    this.tnDialog.open(
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
      .closed
      .pipe(
        filter((data: { confirmed: boolean; force: boolean }) => !!data?.confirmed),
        switchMap(({ force }) => {
          return this.api.call('nvmet.host.delete', [host.id, { force }]).pipe(
            this.errorHandler.withErrorHandler(),
            this.loader.withLoader(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.nvmeOfStore.reloadHosts();
      });
  }
}
