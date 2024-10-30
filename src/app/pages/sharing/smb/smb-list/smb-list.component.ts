import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, of, take, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { shared, helptextSharingSmb } from 'app/helptext/sharing';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { smbListElements } from 'app/pages/sharing/smb/smb-list/smb-list.elements';
import { isRootShare } from 'app/pages/sharing/utils/smb.utils';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-smb-list',
  templateUrl: './smb-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    ServiceStateButtonComponent,
    SearchInput1Component,
    MatAnchor,
    TestDirective,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    UiSearchDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
  ],
})
export class SmbListComponent implements OnInit {
  readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  protected readonly searchableElements = smbListElements;

  service$ = this.store$.select(selectService(ServiceName.Cifs));

  filterString = '';
  dataProvider: AsyncDataProvider<SmbShare>;

  smbShares: SmbShare[] = [];
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
    yesNoColumn({
      title: this.translate.instant('Audit Logging'),
      getValue: (row) => Boolean(row.audit?.enable),
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (smbShare) => {
            const slideInRef = this.slideInService.open(SmbFormComponent, { data: { existingSmbShare: smbShare } });
            slideInRef.slideInClosed$
              .pipe(take(1), filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.dataProvider.load());
          },
        },
        {
          iconName: iconMarker('share'),
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
          iconName: iconMarker('security'),
          tooltip: helptextSharingSmb.action_edit_acl,
          requiredRoles: this.requiredRoles,
          disabled: (row) => of(isRootShare(row.path)),
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
          iconName: iconMarker('mdi-delete'),
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
                ).subscribe(() => {
                  this.dataProvider.load();
                });
              },
            });
          },
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'smb-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('SMB Share')],
  });

  constructor(
    private appLoader: AppLoaderService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private slideInService: SlideInService,
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
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
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
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.smbShares.length ? [] : Object.keys(this.smbShares[0]) as (keyof SmbShare)[],
    });
    this.cdr.markForCheck();
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private lockedPathDialog(path: string): void {
    this.dialog.error({
      title: this.translate.instant('Error'),
      message: this.translate.instant('The path <i>{path}</i> is in a locked dataset.', { path }),
    });
  }
}
