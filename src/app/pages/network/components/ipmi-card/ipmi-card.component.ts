import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, of } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import {
  IpmiEventsDialogComponent,
} from 'app/pages/network/components/ipmi-card/ipmi-events-dialog/ipmi-events-dialog.component';
import { IpmiFormComponent } from 'app/pages/network/components/ipmi-card/ipmi-form/ipmi-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ipmi-card',
  templateUrl: './ipmi-card.component.html',
  styleUrls: ['./ipmi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpmiCardComponent implements OnInit {
  protected dataProvider: AsyncDataProvider<Ipmi>;
  columns = createTable<Ipmi>([
    textColumn({
      getValue: (row) => this.translate.instant('Channel {n}', { n: row.channel }),
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          hidden: (row) => of(!this.canOpen(row)),
          iconName: 'launch',
          tooltip: this.translate.instant('Open'),
          onClick: (row) => this.onOpen(row),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'ipmi-' + row.channel + '-' + row.ip_address,
  });

  protected readonly hasIpmi$ = this.ws.call('ipmi.is_loaded');

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    @Inject(WINDOW) private window: Window,
  ) { }

  ngOnInit(): void {
    const ipmi$ = this.ws.call('ipmi.lan.query').pipe(untilDestroyed(this));
    this.dataProvider = new AsyncDataProvider<Ipmi>(ipmi$);
    this.loadIpmiEntries();
  }

  canOpen(ipmi: Ipmi): boolean {
    return ipmi.ip_address !== '0.0.0.0';
  }

  onEdit(ipmi: Ipmi): void {
    this.slideInService.open(IpmiFormComponent, { data: ipmi.id })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.loadIpmiEntries());
  }

  onOpen(ipmi: Ipmi): void {
    this.window.open(`https://${ipmi.ip_address}`);
  }

  onOpenEvents(): void {
    this.matDialog.open(IpmiEventsDialogComponent);
  }

  private loadIpmiEntries(): void {
    this.dataProvider.load();
  }
}
