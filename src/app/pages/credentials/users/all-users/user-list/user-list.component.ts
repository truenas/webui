import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, output, input, signal, inject } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getUserType } from 'app/helpers/user.helper';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { createTable } from 'app/modules/ix-table/utils';
import { UsersDataProvider } from 'app/pages/credentials/users/all-users/users-data-provider';
import { UsersSearchComponent } from 'app/pages/credentials/users/all-users/users-search/users-search.component';
import { UserAccessCellComponent } from './user-access-cell/user-access-cell.component';

@UntilDestroy()
@Component({
  selector: 'ix-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    AsyncPipe,
    IxTableBodyComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTablePagerComponent,
    IxTableCellDirective,
    UsersSearchComponent,
    UserAccessCellComponent,
  ],
})
export class UserListComponent {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private searchDirectives = inject(UiSearchDirectivesService);

  readonly toggleShowMobileDetails = output<boolean>();
  readonly userSelected = output<User>();
  protected readonly currentBatch = signal<User[]>([]);
  readonly dataProvider = input.required<UsersDataProvider>();

  protected readonly pagination: TablePagination = {
    pageSize: 50,
    pageNumber: 1,
  };

  protected columns = createTable<User>([
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
    textColumn({
      title: this.translate.instant('Full Name'),
      propertyName: 'full_name',
    }),
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'builtin',
      getValue: (user) => this.translate.instant(getUserType(user)),
    }),
    templateColumn({
      title: this.translate.instant('Access'),
      propertyName: 'roles',
      disableSorting: true,
    }),
  ], {
    uniqueRowTag: (row) => 'user-' + row.username,
    ariaLabels: (row) => [row.username, this.translate.instant('User')],
  });

  constructor() {
    setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 5);
  }

  navigateToDetails(user: User): void {
    this.userSelected.emit(user);
    this.toggleShowMobileDetails.emit(true);
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }

  expanded(row: User): void {
    if (!row) return;

    this.navigateToDetails(row);
    this.toggleShowMobileDetails.emit(true);
  }
}
