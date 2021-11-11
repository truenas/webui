import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { WebSocketService, DialogService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  selector: 'app-ntp-server-list',
  templateUrl: './ntp-server-list.component.html',
  styleUrls: ['./ntp-server-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NtpServerListComponent implements OnInit {
  dataSource: MatTableDataSource<NtpServer>;
  displayedColumns = [
    'address',
    'burst',
    'iburst',
    'prefer',
    'minpoll',
    'maxpoll',
    'actions',
  ];

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private ixModalService: IxModalService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.getData();

    this.ixModalService.onClose$.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.getData();
    });
  }

  getData(): void {
    this.ws.call('system.ntpserver.query').pipe(
      untilDestroyed(this),
    ).subscribe((servers) => {
      this.dataSource = new MatTableDataSource(servers);
      this.cdr.markForCheck();
    });
  }

  doAdd(): void {
    this.ixModalService.open(NtpServerFormComponent);
  }

  doEdit(server: NtpServer): void {
    const modal = this.ixModalService.open(NtpServerFormComponent);
    modal.setupForm(server);
  }

  doDelete(server: NtpServer): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete NTP Server'),
      message: this.translate.instant('Are you sure you want to delete the <b>{address}</b> NTP Server?',
        { address: server.address }),
      hideCheckBox: true,
      buttonMsg: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.ws.call('system.ntpserver.delete', [server.id]).pipe(
        untilDestroyed(this),
      ).subscribe(() => {
        this.getData();
      });
    });
  }
}
