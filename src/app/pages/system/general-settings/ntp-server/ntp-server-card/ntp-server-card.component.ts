import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { NtpServerFormComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-form/ntp-server-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ntp-server-card',
  templateUrl: './ntp-server-card.component.html',
  styleUrls: ['./ntp-server-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NtpServerCardComponent implements OnInit {
  dataSource = new MatTableDataSource<NtpServer>([]);
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
    const slideInRef = this.slideInService.open(NtpServerFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.getData());
  }

  doEdit(server: NtpServer): void {
    const slideInRef = this.slideInService.open(NtpServerFormComponent, { data: server });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.getData());
  }

  doDelete(server: NtpServer): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete NTP Server'),
      message: this.translate.instant('Are you sure you want to delete the <b>{address}</b> NTP Server?',
        { address: server.address }),
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('system.ntpserver.delete', [server.id])),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getData();
    });
  }
}
