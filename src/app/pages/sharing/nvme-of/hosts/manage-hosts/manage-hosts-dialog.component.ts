import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialog, TnDialogShellComponent, tnIconMarker } from '@truenas/ui-components';
import { filter, map, switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { NvmeOfHost, PortOrHostDeleteDialogData, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
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
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface NvmeOfHostAndUsage extends NvmeOfHost {
  usedInSubsystems: number;
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
    IxTableBodyComponent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableEmptyDirective,
  ],
})
export class ManageHostsDialog implements OnInit {
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

  protected columns = createTable<NvmeOfHostAndUsage>([
    textColumn({
      title: this.translate.instant('NQN'),
      propertyName: 'hostnqn',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
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

  ngOnInit(): void {
    this.dataProvider.load();
  }

  onAdd(): void {
    // The side panel mounts on document.body and paints on top of this dialog's backdrop,
    // so the dialog can stay open behind it (no need to close it first as the slide-in did).
    this.formPanel
      .open(HostFormComponent, { title: this.translate.instant('Add Host') })
      .onSuccess(() => {
        this.snackbar.success(this.translate.instant('Host Added'));
        this.nvmeOfStore.reloadHosts();
      }, this.destroyRef);
  }

  onEdit(host: NvmeOfHostAndUsage): void {
    this.formPanel
      .open(HostFormComponent, { title: this.translate.instant('Edit Host'), inputs: { host } })
      .onSuccess(() => {
        this.snackbar.success(this.translate.instant('Host Updated'));
        this.nvmeOfStore.reloadHosts();
      }, this.destroyRef);
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
