import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AuthorizedAccessFormComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-authorizedaccess-list',
  templateUrl: './authorized-access-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    SearchInput1Component,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AuthorizedAccessListComponent implements OnInit {
  readonly requiredRoles = [
    Role.SharingIscsiAuthWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  isLoading = false;
  filterString = '';
  dataProvider: AsyncDataProvider<IscsiAuthAccess>;

  authAccess: IscsiAuthAccess[] = [];

  columns = createTable<IscsiAuthAccess>([
    textColumn({
      title: this.translate.instant('Group ID'),
      propertyName: 'tag',
    }),
    textColumn({
      title: this.translate.instant('User'),
      propertyName: 'user',
    }),
    textColumn({
      title: this.translate.instant('Peer User'),
      propertyName: 'peeruser',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => {
            const slideInRef = this.slideInService.open(AuthorizedAccessFormComponent, { data: row });
            slideInRef.slideInClosed$
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.refresh());
          },
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => {
            this.dialogService.confirm({
              title: this.translate.instant('Delete'),
              message: this.translate.instant('Are you sure you want to delete this item?'),
              buttonText: this.translate.instant('Delete'),
            }).pipe(
              filter(Boolean),
              switchMap(() => this.ws.call('iscsi.auth.delete', [row.id]).pipe(this.loader.withLoader())),
              untilDestroyed(this),
            ).subscribe({
              next: () => this.refresh(),
              error: (error: unknown) => {
                this.dialogService.error(this.errorHandler.parseError(error));
              },
            });
          },
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'iscsi-authorized-access-' + row.user + '-' + row.peeruser,
    ariaLabels: (row) => [row.user, this.translate.instant('Authorized Access')],
  });

  constructor(
    public emptyService: EmptyService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: SlideInService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private iscsiService: IscsiService,
  ) {}

  ngOnInit(): void {
    const authorizedAccess$ = this.iscsiService.getAuth().pipe(
      tap((authAccess) => this.authAccess = authAccess),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider(authorizedAccess$);
    this.refresh();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(AuthorizedAccessFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.refresh());
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({ query, columnKeys: ['peeruser', 'user'] });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
