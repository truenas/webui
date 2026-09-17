import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, output, input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective,
  TnTableComponent, TnTablePagerComponent, TnTestIdDirective, type TnSortEvent,
} from '@truenas/ui-components';
import { getUserType } from 'app/helpers/user.helper';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { mapTnSortToTableSort, memoizedRowTag } from 'app/modules/tn-table/utils';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { UsersDataProvider } from 'app/pages/credentials/users/all-users/users-data-provider';
import { UsersSearchComponent } from 'app/pages/credentials/users/all-users/users-search/users-search.component';
import { UserAccessCellComponent } from './user-access-cell/user-access-cell.component';

@Component({
  selector: 'ix-user-list',
  templateUrl: './user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    AsyncPipe,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTablePagerComponent,
    TnTestIdDirective,
    TableTextCellComponent,
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
  readonly dataProvider = input.required<UsersDataProvider>();

  protected readonly displayedColumns = ['username', 'full_name', 'builtin', 'roles'];
  protected readonly trackByUid = (_index: number, row: User): number => row.uid;

  /**
   * Row tag behind every cell's test id, kept at the value the legacy `ix-table` row carried
   * (`row-user-<username>`) so the ids Release Engineering already selects on still resolve.
   * tn-table has no per-row test id of its own, so the cells are the row's only handle.
   */
  protected readonly uniqueRowTag = memoizedRowTag<User>((user) => `user-${user.username}`);

  protected userType(row: User): string {
    return this.translate.instant(getUserType(row));
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider().setSorting(mapTnSortToTableSort<User>(event, this.displayedColumns));
  }

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
