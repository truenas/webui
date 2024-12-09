import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  map, filter, switchMap, BehaviorSubject, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { LoadingMap, accumulateLoadingState } from 'app/helpers/operators/accumulate-loading-state.helper';
import { SmbShare, SmbSharesec } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { isRootShare } from 'app/pages/sharing/utils/smb.utils';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-smb-card',
  templateUrl: './smb-card.component.html',
  styleUrls: ['./smb-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    IxIconComponent,
    ServiceStateButtonComponent,
    RequiresRolesDirective,
    MatButton,
    ServiceExtraActionsComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
  ],
})
export class SmbCardComponent implements OnInit {
  requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  loadingMap$ = new BehaviorSubject<LoadingMap>(new Map());

  service$ = this.store$.select(selectService(ServiceName.Cifs));

  dataProvider: AsyncDataProvider<SmbShare>;

  columns = createTable<SmbShare>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path_local',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: SmbShare) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    yesNoColumn({
      title: this.translate.instant('Audit Logging'),
      getValue: (row) => Boolean(row.audit?.enable),
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: iconMarker('share'),
          tooltip: this.translate.instant('Edit Share ACL'),
          onClick: (row) => this.doShareAclEdit(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('security'),
          tooltip: this.translate.instant('Edit Filesystem ACL'),
          disabled: (row) => of(isRootShare(row.path)),
          onClick: (row) => this.doFilesystemAclEdit(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          disabled: (row) => this.loadingMap$.pipe(map((ids) => ids.get(row.id))),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-smb-share-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('SMB Share')],
  });

  constructor(
    private slideInService: SlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private dialogService: DialogService,
    protected emptyService: EmptyService,
    private router: Router,
    private store$: Store<ServicesState>,
  ) {}

  ngOnInit(): void {
    const smbShares$ = this.api.call('sharing.smb.query').pipe(untilDestroyed(this));
    this.dataProvider = new AsyncDataProvider<SmbShare>(smbShares$);
    this.setDefaultSort();
    this.dataProvider.load();
  }

  openForm(row?: SmbShare): void {
    const slideInRef = this.slideInService.open(SmbFormComponent, { data: { existingSmbShare: row } });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.dataProvider.load();
    });
  }

  doDelete(smb: SmbShare): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete SMB Share <b>"{name}"</b>?', { name: smb.name }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('sharing.smb.delete', [smb.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  doShareAclEdit(row: SmbShare): void {
    if (row.locked) {
      this.showLockedPathDialog(row.path);
    } else {
      // A home share has a name (homes) set; row.name works for other shares
      const searchName = row.home ? 'homes' : row.name;
      this.api.call('sharing.smb.getacl', [{ share_name: searchName }])
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (shareAcl: SmbSharesec) => {
            const slideInRef = this.slideInService.open(SmbAclComponent, { data: shareAcl.share_name });

            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.dataProvider.load();
            });
          },
          error: (error: unknown) => {
            this.dialogService.error(this.errorHandler.parseError(error));
          },
        });
    }
  }

  doFilesystemAclEdit(row: SmbShare): void {
    if (row.locked) {
      this.showLockedPathDialog(row.path);
    } else {
      this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
        queryParams: {
          path: row.path_local,
        },
      });
    }
  }

  private showLockedPathDialog(path: string): void {
    this.dialogService.error({
      title: this.translate.instant('Error'),
      message: this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    });
  }

  private onChangeEnabledState(row: SmbShare): void {
    const param = 'enabled';

    this.api.call('sharing.smb.update', [row.id, { [param]: !row[param] }]).pipe(
      accumulateLoadingState(row.id, this.loadingMap$),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.dataProvider.load();
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }
}
