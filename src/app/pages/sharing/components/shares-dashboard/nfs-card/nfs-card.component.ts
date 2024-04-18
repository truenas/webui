import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  tap, map, filter, switchMap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingNfs } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table/utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-nfs-card',
  templateUrl: './nfs-card.component.html',
  styleUrls: ['./nfs-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsCardComponent implements OnInit {
  requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];

  service$ = this.store$.select(selectService(ServiceName.Nfs));

  nfsShares: NfsShare[] = [];
  dataProvider: AsyncDataProvider<NfsShare>;

  columns = createTable<NfsShare>([
    textColumn({
      title: this.translate.instant(helptextSharingNfs.column_path),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant(helptextSharingNfs.column_comment),
      propertyName: 'comment',
    }),
    toggleColumn({
      title: this.translate.instant(helptextSharingNfs.column_enabled),
      propertyName: 'enabled',
      onRowToggle: (row: NfsShare) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    actionsColumn({
      cssClass: 'tight-actions',
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
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
    rowTestId: (row) => 'card-nfs-share-' + row.path + '-' + row.comment,
  });

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private store$: Store<ServicesState>,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const nfsShares$ = this.ws.call('sharing.nfs.query').pipe(
      tap((nfsShares) => this.nfsShares = nfsShares),
      map((nfsShares) => nfsShares.slice(0, 4)),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<NfsShare>(nfsShares$);
    this.getNfsShares();
  }

  openForm(row?: NfsShare): void {
    const slideInRef = this.slideInService.open(NfsFormComponent, { data: { existingNfsShare: row } });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
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
    this.dataProvider.load();
  }

  private onChangeEnabledState(row: NfsShare): void {
    const param = 'enabled';

    this.ws.call('sharing.nfs.update', [row.id, { [param]: !row[param] }]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.getNfsShares();
      },
      error: (error: unknown) => {
        this.getNfsShares();
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }
}
