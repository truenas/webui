import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextSharingNfs } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Service } from 'app/interfaces/service.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-nfs-card',
  templateUrl: './nfs-card.component.html',
  styleUrls: ['./nfs-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsCardComponent implements OnInit {
  @Input() service: Service;

  @Output() statusChanged = new EventEmitter<ServiceStatus>();

  isLoading = false;
  nfsShares: NfsShare[] = [];
  dataProvider = new ArrayDataProvider<NfsShare>();

  columns = createTable<NfsShare>([
    textColumn({
      title: helptextSharingNfs.column_path,
      propertyName: 'path',
    }),
    textColumn({
      title: helptextSharingNfs.column_comment,
      propertyName: 'comment',
    }),
    toggleColumn({
      title: helptextSharingNfs.column_enabled,
      propertyName: 'enabled',
      cssClass: 'justify-end',
      onRowToggle: (row: NfsShare) => this.onChangeEnabledState(row),
    }),
    textColumn({
      propertyName: 'id',
      cssClass: 'tight-actions',
    }),
  ]);

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getNfsShares();
  }

  openForm(row?: NfsShare): void {
    const slideInRef = this.slideInService.open(NfsFormComponent, { data: row });

    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getNfsShares();
    });
  }

  doDelete(nfs: NfsShare): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete NFS Share <b>"{path}"</b>?', { path: nfs.path }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('sharing.nfs.delete', [nfs.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getNfsShares();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  private getNfsShares(): void {
    this.isLoading = true;
    this.ws.call('sharing.nfs.query').pipe(
      untilDestroyed(this),
    ).subscribe((nfsShares: NfsShare[]) => {
      this.nfsShares = nfsShares;
      this.dataProvider.setRows(nfsShares.slice(0, 4));
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private onChangeEnabledState(row: NfsShare): void {
    const param = 'enabled';

    this.ws.call('sharing.nfs.update', [row.id, { [param]: !row[param] }]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.getNfsShares();
      },
      error: (error: WebsocketError) => {
        this.getNfsShares();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }
}
