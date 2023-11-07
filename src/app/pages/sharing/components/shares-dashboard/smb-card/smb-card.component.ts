import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { tap, map, filter, switchMap } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingSmb } from 'app/helptext/sharing/smb/smb';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-smb-card',
  templateUrl: './smb-card.component.html',
  styleUrls: ['./smb-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbCardComponent implements OnInit, OnChanges {
  @Input() isClustered: boolean;
  service$ = this.store$.select(selectService(ServiceName.Cifs));

  smbShares: SmbShare[] = [];
  dataProvider: AsyncDataProvider<SmbShare>;
  title = T('Windows (SMB) Shares');

  isAddActionDisabled = false;
  isDeleteActionDisabled = false;
  tableHint?: string;

  columns = createTable<SmbShare>([
    textColumn({
      title: helptextSharingSmb.column_name,
      propertyName: 'name',
    }),
    textColumn({
      title: helptextSharingSmb.column_path,
      propertyName: 'path_local',
    }),
    textColumn({
      title: helptextSharingSmb.column_comment,
      propertyName: 'comment',
    }),
    toggleColumn({
      title: helptextSharingSmb.column_enabled,
      propertyName: 'enabled',
      onRowToggle: (row: SmbShare) => this.onChangeEnabledState(row),
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: 'share',
          tooltip: this.translate.instant('Edit Share ACL'),
          onClick: (row) => this.doShareAclEdit(row),
        },
        {
          iconName: 'security',
          tooltip: this.translate.instant('Edit Filesystem ACL'),
          onClick: (row) => this.doFilesystemAclEdit(row),
        },
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ]);

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
    private router: Router,
    private store$: Store<ServicesState>,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!changes.isClustered?.currentValue && !!changes.isClustered?.previousValue) {
      this.updateEnabledFieldVisibility(false);
      this.isAddActionDisabled = false;
      this.isDeleteActionDisabled = false;
      this.tableHint = null;
    }

    if (!!changes.isClustered?.currentValue && !changes.isClustered?.previousValue) {
      this.updateEnabledFieldVisibility(true);

      this.isAddActionDisabled = true;
      this.isDeleteActionDisabled = true;
      this.tableHint = this.translate.instant('This share is configured through TrueCommand');
    }
  }

  ngOnInit(): void {
    const smbShares$ = this.ws.call('sharing.smb.query').pipe(
      tap((smbShares) => this.smbShares = smbShares),
      map((smbShares) => smbShares.slice(0, 4)),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<SmbShare>(smbShares$);
    this.getSmbShares();
  }

  openForm(row?: SmbShare): void {
    if (this.isClustered) {
      this.dialogService.info(
        this.translate.instant(this.title),
        this.translate.instant(this.tableHint),
      );
    } else {
      const slideInRef = this.slideInService.open(SmbFormComponent, { data: row });
      slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.getSmbShares();
      });
    }
  }

  doDelete(smb: SmbShare): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete SMB Share <b>"{name}"</b>?', { name: smb.name }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('sharing.smb.delete', [smb.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getSmbShares();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  doShareAclEdit(row: SmbShare): void {
    this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
      (isLocked) => {
        if (isLocked) {
          this.showLockedPathDialog(row.path);
        } else {
          // A home share has a name (homes) set; row.name works for other shares
          const searchName = row.home ? 'homes' : row.name;
          this.ws.call('sharing.smb.getacl', [{ share_name: searchName }])
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (shareAcl: SmbSharesec) => {
                const slideInRef = this.slideInService.open(SmbAclComponent, { data: shareAcl.share_name });

                slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
                  this.getSmbShares();
                });
              },
              error: (error: WebsocketError) => {
                this.dialogService.error(this.errorHandler.parseWsError(error));
              },
            });
        }
      },
    );
  }

  doFilesystemAclEdit(row: SmbShare): void {
    this.ws.call('pool.dataset.path_in_locked_datasets', [row.path]).pipe(untilDestroyed(this)).subscribe(
      (isLocked) => {
        if (isLocked) {
          this.showLockedPathDialog(row.path);
        } else {
          this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
            queryParams: {
              path: row.path_local,
            },
          });
        }
      },
    );
  }

  private showLockedPathDialog(path: string): void {
    this.dialogService.error({
      title: helptextSharingSmb.action_edit_acl_dialog.title,
      message: this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    });
  }

  private getSmbShares(): void {
    this.dataProvider.load();
  }

  private onChangeEnabledState(row: SmbShare): void {
    const param = 'enabled';

    this.ws.call('sharing.smb.update', [row.id, { [param]: !row[param] }]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.getSmbShares();
      },
      error: (error: WebsocketError) => {
        this.getSmbShares();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  private updateEnabledFieldVisibility(hidden: boolean): void {
    this.columns = this.columns.map((column) => {
      if (column.propertyName === 'enabled') {
        return { ...column, hidden };
      }
      return column;
    });
    this.cdr.markForCheck();
  }
}
