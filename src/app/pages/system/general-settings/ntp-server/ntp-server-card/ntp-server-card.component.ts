import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { elements } from 'app/pages/system/general-settings/ntp-server/ntp-server-card/ntp-server-card.elements';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ntp-server-card',
  templateUrl: './ntp-server-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NtpServerCardComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchElements = elements;

  dataProvider: AsyncDataProvider<NtpServer>;

  columns = createTable<NtpServer>([
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    yesNoColumn({
      title: this.translate.instant('Burst'),
      propertyName: 'burst',
    }),
    yesNoColumn({
      title: this.translate.instant('IBurst'),
      propertyName: 'iburst',
    }),
    yesNoColumn({
      title: this.translate.instant('Prefer'),
      propertyName: 'prefer',
    }),
    textColumn({
      title: this.translate.instant('Min Poll'),
      propertyName: 'minpoll',
    }),
    textColumn({
      title: this.translate.instant('Max Poll'),
      propertyName: 'maxpoll',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'ntp-server-' + row.address + '-' + row.minpoll + '-' + row.maxpoll,
  });

  constructor(
    protected emptyService: EmptyService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private slideInService: IxSlideInService,
  ) {}

  ngOnInit(): void {
    const ntpServers$ = this.ws.call('system.ntpserver.query').pipe(untilDestroyed(this));
    this.dataProvider = new AsyncDataProvider<NtpServer>(ntpServers$);
    this.loadItems();
  }

  loadItems(): void {
    this.dataProvider.load();
  }

  doDelete(server: NtpServer): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete NTP Server'),
      message: this.translate.instant(
        'Are you sure you want to delete the <b>{address}</b> NTP Server?',
        { address: server.address },
      ),
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('system.ntpserver.delete', [server.id])),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loadItems();
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(NtpServerFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.loadItems());
  }

  doEdit(server: NtpServer): void {
    const slideInRef = this.slideInService.open(NtpServerFormComponent, { data: server });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.loadItems());
  }
}
