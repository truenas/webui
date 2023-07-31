import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WINDOW } from 'app/helpers/window.helper';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { createTable } from 'app/modules/ix-table2/utils';
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
  protected dataProvider = new ArrayDataProvider<Ipmi>();
  columns = createTable<Ipmi>([
    { propertyName: 'channel' },
    { propertyName: 'id' }, // Actions column
  ]);

  protected readonly hasIpmi$ = this.ws.call('ipmi.is_loaded');

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    @Inject(WINDOW) private window: Window,
  ) { }

  ngOnInit(): void {
    this.loadIpmiEntries();
  }

  canOpen(ipmi: Ipmi): boolean {
    return ipmi.ip_address !== '0.0.0.0';
  }

  onEdit(ipmi: Ipmi): void {
    this.slideInService.open(IpmiFormComponent, { data: ipmi.id })
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadIpmiEntries());
  }

  onOpen(ipmi: Ipmi): void {
    this.window.open(`https://${ipmi.ip_address}`);
  }

  onOpenEvents(): void {
    this.matDialog.open(IpmiEventsDialogComponent);
  }

  private loadIpmiEntries(): void {
    this.ws.call('ipmi.lan.query').pipe(untilDestroyed(this)).subscribe((ipmi) => {
      this.dataProvider.setRows(ipmi);
    });
  }
}
