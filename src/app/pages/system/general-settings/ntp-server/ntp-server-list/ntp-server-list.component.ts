import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { IxTableStatus } from 'app/modules/ix-tables/enums/ix-table-status.enum';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'app-ntp-server-list',
  templateUrl: './ntp-server-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NtpServerListComponent implements OnInit {
  dataSource: MatTableDataSource<NtpServer> = new MatTableDataSource([]);
  displayedColumns = [
    'address',
    'burst',
    'iburst',
    'prefer',
    'minpoll',
    'maxpoll',
    'actions',
  ];

  status: IxTableStatus = IxTableStatus.Loading;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.getData();

    this.slideInService.onClose$.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.getData();
    });
  }

  createDataSource(servers: NtpServer[] = []): void {
    this.dataSource = new MatTableDataSource(servers);
  }

  getData(): void {
    this.status = IxTableStatus.Loading;

    this.ws.call('system.ntpserver.query').pipe(
      untilDestroyed(this),
    ).subscribe((servers) => {
      this.status = IxTableStatus.Ready;
      this.createDataSource(servers);
      this.cdr.markForCheck();
    }, () => {
      this.status = IxTableStatus.Error;
      this.createDataSource();
      this.cdr.markForCheck();
    });
  }

  doAdd(): void {
    this.slideInService.open(NtpServerFormComponent);
  }

  doEdit(server: NtpServer): void {
    const modal = this.slideInService.open(NtpServerFormComponent);
    modal.setupForm(server);
  }

  doDelete(server: NtpServer): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete NTP Server'),
      message: this.translate.instant('Are you sure you want to delete the <b>{address}</b> NTP Server?',
        { address: server.address }),
      buttonMsg: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('system.ntpserver.delete', [server.id])),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getData();
    });
  }
}
