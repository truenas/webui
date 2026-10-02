import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { filter, last, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName, ServiceOperation } from 'app/enums/service-name.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ntpServersElements } from 'app/pages/system/advanced/ntp-servers/ntp-servers-card/ntp-servers-card.elements';
import { getNtpServersFormConfig } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers.form-config';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-ntp-servers-card',
  templateUrl: './ntp-servers-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableTextCellComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class NtpServersCardComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private formPanel = inject(FormSidePanelService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.NetworkGeneralWrite];
  protected readonly syncRequiredRoles = [Role.ServiceWrite];
  protected readonly searchableElements = ntpServersElements;

  dataProvider: AsyncDataProvider<NtpServer>;

  protected readonly displayedColumns = ['address', 'burst', 'iburst', 'prefer', 'minpoll', 'maxpoll', 'actions'];

  protected readonly trackByNtpId = (_: number, row: NtpServer): number => row.id;

  protected readonly actions: IconActionConfig<NtpServer>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.doEdit(row),
      requiredRoles: this.requiredRoles,
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.doDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected readonly uniqueRowTag = (row: NtpServer): string => (
    `ntp-server-${row.address}-${row.minpoll}-${row.maxpoll}`
  );

  protected ariaLabel(row: NtpServer): string {
    return [row.address, this.translate.instant('NTP Server')].join(' ');
  }

  ngOnInit(): void {
    const ntpServers$ = this.api.call('system.ntpserver.query').pipe(takeUntilDestroyed(this.destroyRef));
    this.dataProvider = new AsyncDataProvider<NtpServer>(ntpServers$);
    this.loadItems();
  }

  loadItems(): void {
    this.dataProvider.load();
  }

  doDelete(server: NtpServer): void {
    this.dialog.confirmDelete({
      title: this.translate.instant('Delete NTP Server'),
      message: this.translate.instant(
        'Are you sure you want to delete the <b>{address}</b> NTP Server?',
        { address: server.address },
      ),
      call: () => this.api.call('system.ntpserver.delete', [server.id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.loadItems();
    });
  }

  doEdit(server: NtpServer): void {
    this.formPanel.openForm(getNtpServersFormConfig(this.api, this.translate, server), {
      title: this.translate.instant('Edit NTP Server'),
      editData: server,
    }).onSuccess(() => this.loadItems(), this.destroyRef);
  }

  doAdd(): void {
    this.formPanel.openForm(getNtpServersFormConfig(this.api, this.translate, undefined), {
      title: this.translate.instant('Add NTP Server'),
    }).onSuccess(() => this.loadItems(), this.destroyRef);
  }

  /**
   * There is no dedicated "sync now" endpoint: restarting chronyd makes it poll the servers
   * in an iburst and step the clock, since chrony.conf allows a step in the first updates (`makestep`).
   */
  protected doSyncTime(): void {
    this.dialog.confirm({
      title: this.translate.instant('Sync Time'),
      message: this.translate.instant(
        'Synchronize the system time with the configured NTP servers? The NTP service will be restarted, and the clock will be set to the NTP time within a few seconds, even if it is far off.',
      ),
      buttonText: this.translate.instant('Sync Time'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.job('service.control', [ServiceOperation.Restart, ServiceName.Ntpd, { silent: false }]).pipe(
        observeJob(),
        last(),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('System time is being synchronized with the NTP servers.'));
    });
  }
}
