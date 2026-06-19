import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild,
} from '@angular/core';
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
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ntpServersElements } from 'app/pages/system/advanced/ntp-servers/ntp-servers-card/ntp-servers-card.elements';
import { NtpServersFormComponent } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers-form.component';

@Component({
  selector: 'ix-ntp-servers-card',
  templateUrl: './ntp-servers-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    NtpServersFormComponent,
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
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.NetworkGeneralWrite];
  protected readonly searchableElements = ntpServersElements;

  protected configOpen = signal(false);
  protected editingServer = signal<NtpServer | undefined>(undefined);
  protected configForm = viewChild(NtpServersFormComponent);

  protected readonly panelTitle = computed(() => (
    this.editingServer()
      ? this.translate.instant('Edit NTP Server')
      : this.translate.instant('Add NTP Server')
  ));

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

  protected uniqueRowTag(row: NtpServer): string {
    return `ntp-server-${row.address}-${row.minpoll}-${row.maxpoll}`;
  }

  protected ariaLabel(row: NtpServer): string {
    return [row.address, this.translate.instant('NTP Server')].join(' ');
  }

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

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
    this.editingServer.set(server);
    this.configOpen.set(true);
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    this.editingServer.set(undefined);
    if (saved) {
      this.loadItems();
    }
  }

  doAdd(): void {
    this.editingServer.set(undefined);
    this.configOpen.set(true);
  }
}
