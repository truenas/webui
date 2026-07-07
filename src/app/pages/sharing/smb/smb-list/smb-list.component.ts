import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { tnIconMarker, TnTablePagerComponent } from '@truenas/ui-components';
import { of, tap } from 'rxjs';
import { smbCardEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { shared } from 'app/helptext/sharing';
import { SmbSharePurpose, SmbShare, ExternalSmbShareOptions } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { storageTierColumn } from 'app/pages/sharing/components/storage-tier-cell/storage-tier-cell.component';
import { SmbAclComponent } from 'app/pages/sharing/smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { smbListElements } from 'app/pages/sharing/smb/smb-list/smb-list.elements';
import { getFilesystemAclUnavailableReason, getUnavailableReason, isShareUnavailable } from 'app/pages/sharing/utils/share-exported-pool.utils';
import { isRootShare } from 'app/pages/sharing/utils/smb.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@Component({
  selector: 'ix-smb-list',
  templateUrl: './smb-list.component.html',
  styleUrls: ['./smb-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    ServiceStateButtonComponent,
    BasicSearchComponent,
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
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    EmptyComponent,
  ],
})
export class SmbListComponent implements OnInit {
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<ServicesState>>(Store);
  private poolStoreService = inject(poolStore);
  private tierService = inject(SharingTierService);

  protected readonly requiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  protected readonly searchableElements = smbListElements;
  protected readonly emptyConfig = smbCardEmptyConfig;
  protected readonly EmptyType = EmptyType;

  service$ = this.store$.select(selectService(ServiceName.Cifs));

  searchQuery = signal('');
  dataProvider: AsyncDataProvider<SmbShare>;

  smbShares: SmbShare[] = [];
  /** null = pools not yet loaded; string[] once pool.query completes */
  private activePoolPaths = signal<string[] | null>(null);

  private tierAction: IconActionConfig<SmbShare> = this.tierService.createChangeTierAction<SmbShare>({
    destroyRef: this.destroyRef,
    reload: () => this.dataProvider.load(),
    requiredRoles: this.requiredRoles,
  });

  columns = createTable<SmbShare>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Path'),
      getValue: (row) => (row.options as ExternalSmbShareOptions)?.remote_path?.join(', ') || row.path,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      requiredRoles: this.requiredRoles,
      onRowToggle: (row) => this.onChangeEnabledState(row),
      isDisabled: (row: SmbShare) => isShareUnavailable(row, this.activePoolPaths()),
      getDisabledTooltip: (row: SmbShare) => this.translate.instant(getUnavailableReason(row, this.activePoolPaths())),
    }),
    yesNoColumn({
      title: this.translate.instant('Audit Logging'),
      getValue: (row) => Boolean(row.audit?.enable),
    }),
    storageTierColumn({
      title: this.translate.instant('Storage Tier'),
      hidden: true,
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: tnIconMarker('pencil', 'mdi'),
          tooltip: this.translate.instant('Edit'),
          onClick: (smbShare) => {
            this.formPanel.open(SmbFormComponent, {
              title: this.translate.instant('Edit SMB Share'),
              inputs: { smbShareData: { existingSmbShare: smbShare } },
            }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
          },
        },
        {
          iconName: tnIconMarker('share-variant', 'mdi'),
          tooltip: this.translate.instant('Edit Share ACL'),
          disabled: (row) => of(isShareUnavailable(row, this.activePoolPaths())),
          disabledTooltip: (row: SmbShare) => this.translate.instant(getUnavailableReason(row, this.activePoolPaths())),
          onClick: (row) => {
            // A home share has a name (homes) set; row.name works for other shares
            const searchName = (row.purpose === SmbSharePurpose.LegacyShare && row.options?.home)
              ? 'homes'
              : row.name;
            this.loader.open();
            this.api.call('sharing.smb.getacl', [{ share_name: searchName }])
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((shareAcl) => {
                this.loader.close();
                this.formPanel.open(SmbAclComponent, {
                  title: this.translate.instant('Share ACL for {share}', { share: shareAcl.share_name }),
                  inputs: { shareName: shareAcl.share_name },
                }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
              });
          },
        },
        {
          iconName: tnIconMarker('security', 'mdi'),
          tooltip: this.translate.instant('Edit Filesystem ACL'),
          disabled: (row) => of(isRootShare(row.path) || isShareUnavailable(row, this.activePoolPaths())),
          disabledTooltip: (row: SmbShare) => this.translate.instant(
            getFilesystemAclUnavailableReason(row, this.activePoolPaths()),
          ),
          onClick: (row) => {
            this.router.navigate(['/', 'datasets', 'acl', 'edit'], {
              queryParams: {
                path: row.path,
                returnUrl: this.router.url,
              },
            });
          },
        },
        this.tierAction,
        {
          iconName: tnIconMarker('delete', 'mdi'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => {
            this.dialog.confirmDelete({
              title: this.translate.instant('Unshare {name}', { name: row.name }),
              message: this.translate.instant(shared.deleteShareMessage),
              buttonText: this.translate.instant('Unshare'),
              call: () => this.api.call('sharing.smb.delete', [row.id]),
            }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.dataProvider.load());
          },
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'smb-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('SMB Share')],
  });

  ngOnInit(): void {
    const shares$ = this.api.call('sharing.smb.query').pipe(
      tap((shares) => this.smbShares = shares),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<SmbShare>(shares$);
    this.setDefaultSort();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });

    this.poolStoreService.call.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pools) => {
        this.activePoolPaths.set(pools.map((pool) => pool.path));
        this.dataProvider.load();
      },
      error: () => {
        this.dataProvider.load();
      },
    });

    this.tierService.attachTierToShareList<SmbShare>({
      destroyRef: this.destroyRef,
      cdr: this.cdr,
      getColumns: () => this.columns,
      setColumns: (columns) => { this.columns = columns; },
      reload: () => this.dataProvider.load(),
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  protected doAdd(): void {
    this.formPanel.open(SmbFormComponent, {
      title: this.translate.instant('Add SMB Share'),
      inputs: { smbShareData: { existingSmbShare: undefined } },
    }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.smbShares.length ? [] : Object.keys(this.smbShares[0]) as (keyof SmbShare)[],
    });
    this.cdr.markForCheck();
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private onChangeEnabledState(row: SmbShare): void {
    this.api.call('sharing.smb.update', [row.id, { enabled: !row.enabled }]).pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (error: unknown) => {
        this.dataProvider.load();
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
