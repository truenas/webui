import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, of, take, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { shared, helptextSharingSmb } from 'app/helptext/sharing';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  templateUrl: './smb-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbListComponent implements OnInit {
  readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];

  service$ = this.store$.select(selectService(ServiceName.Cifs));

  filterString = '';
  dataProvider: AsyncDataProvider<SmbShare>;

  smbShares: SmbShare[] = [];
  columns = createTable<SmbShare>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path_local',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      requiredRoles: this.requiredRoles,
      onRowToggle: (row) => {
        this.ws.call('sharing.smb.update', [row.id, { enabled: row.enabled }]).pipe(
          this.appLoader.withLoader(),
          untilDestroyed(this),
        ).subscribe({
          next: (share) => {
            row.enabled = share.enabled;
          },
          error: (error: unknown) => {
            this.dataProvider.load();
            this.dialog.error(this.errorHandler.parseError(error));
          },
        });
      },
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (smbShare) => {
            const slideInRef = this.slideInService.open(SmbFormComponent, { data: { existingSmbShare: smbShare } });
            slideInRef.slideInClosed$
              .pipe(take(1), filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.dataProvider.load());
          },
        },
        {
          iconName: 'share',
          tooltip: helptextSharingSmb.action_share_acl,
          requiredRoles: this.requiredRoles,
          onClick: (row) => {
            if (row.locked) {
              this.lockedPathDialog(row.path);
            } else {
              // A home share has a name (homes) set; row.name works for other shares
              const searchName = row.home ? 'homes' : row.name;
              this.appLoader.open();
              this.ws.call('sharing.smb.getacl', [{ share_name: searchName }])
                .pipe(untilDestroyed(this))
                .subscribe((shareAcl) => {
                  this.appLoader.close();
                  const slideInRef = this.slideInService.open(SmbAclComponent, { data: shareAcl.share_name });
                  slideInRef.slideInClosed$.pipe(take(1), untilDestroyed(this)).subscribe(() => {
                    this.dataProvider.load();
                  });
                });
            }
          },
        },
        {
          iconName: 'security',
          tooltip: helptextSharingSmb.action_edit_acl,
          requiredRoles: this.requiredRoles,
          disabled: (row) => of(!row.path.replace('/mnt/', '').includes('/')),
          onClick: (row) => {
            if (row.locked) {
              this.lockedPathDialog(row.path);
            } else {
              this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
                queryParams: {
                  path: row.path_local,
                },
              });
            }
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Unshare'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => {
            this.dialog.confirm({
              title: this.translate.instant('Unshare {name}', { name: row.name }),
              message: shared.delete_share_message,
              buttonText: this.translate.instant('Unshare'),
            }).pipe(
              filter(Boolean),
              untilDestroyed(this),
            ).subscribe({
              next: () => {
                this.ws.call('sharing.smb.delete', [row.id]).pipe(
                  this.appLoader.withLoader(),
                  untilDestroyed(this),
                ).subscribe({
                  next: () => this.dataProvider.load(),
                });
              },
            });
          },
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'smb-' + row.name,
  });

  constructor(
    private appLoader: AppLoaderService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
    private router: Router,
    private store$: Store<ServicesState>,
  ) {}

  ngOnInit(): void {
    const shares$ = this.ws.call('sharing.smb.query').pipe(
      tap((shares) => this.smbShares = shares),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<SmbShare>(shares$);
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(SmbFormComponent);
    slideInRef.slideInClosed$.pipe(take(1), filter(Boolean), untilDestroyed(this)).subscribe({
      next: () => {
        this.dataProvider.load();
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    const filteredExporters = this.smbShares.filter((share) => {
      return JSON.stringify(share).includes(query);
    });
    this.dataProvider.setRows(filteredExporters);
    this.cdr.markForCheck();
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private lockedPathDialog(path: string): void {
    this.dialog.error({
      title: helptextSharingSmb.action_edit_acl_dialog.title,
      message: this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    });
  }
}
