import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-ntp-server-list',
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
  loading = false;
  error = false;

  get emptyType(): EmptyType {
    if (this.loading) {
      return EmptyType.Loading;
    }
    if (this.error) {
      return EmptyType.Errors;
    }
    return EmptyType.NoPageData;
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private dialog: DialogService,
    public emptyService: EmptyService,
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
    this.loading = true;

    this.ws.call('system.ntpserver.query').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (servers) => {
        this.loading = false;
        this.error = false;
        this.createDataSource(servers);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.createDataSource();
        this.cdr.markForCheck();
      },
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
