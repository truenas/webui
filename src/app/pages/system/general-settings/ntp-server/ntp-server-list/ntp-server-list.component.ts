import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'app-ntp-server-list',
  templateUrl: './ntp-server-list.component.html',
  styleUrls: ['./ntp-server-list.component.scss'],
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
  loading = true;
  loadingConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  emptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No servers have been added yet'),
  };
  errorConf: EmptyConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Can not retrieve response'),
  };
  error = false;

  get currentEmptyConf(): EmptyConfig {
    if (this.loading) {
      return this.loadingConf;
    }
    if (this.error) {
      return this.errorConf;
    }
    return this.emptyConf;
  }

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
    this.ws.call('system.ntpserver.query').pipe(
      untilDestroyed(this),
    ).subscribe((servers) => {
      this.loading = false;
      this.error = false;
      this.createDataSource(servers);
      this.cdr.markForCheck();
    }, () => {
      this.loading = false;
      this.error = true;
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
