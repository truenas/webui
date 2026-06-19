import { AsyncPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, output, input, signal, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective,
  TnTableComponent, TnTablePagerComponent, type TnSortEvent,
} from '@truenas/ui-components';
import { getUserType } from 'app/helpers/user.helper';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { UsersDataProvider } from 'app/pages/credentials/users/all-users/users-data-provider';
import { UsersSearchComponent } from 'app/pages/credentials/users/all-users/users-search/users-search.component';
import { UserAccessCellComponent } from './user-access-cell/user-access-cell.component';

@Component({
  selector: 'ix-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    AsyncPipe,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTablePagerComponent,
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

  protected readonly displayedColumns = ['username', 'full_name', 'builtin', 'roles'];
  protected readonly emptyIcon = 'mdi-account-multiple';
  protected readonly trackByUid = (_index: number, row: User): number => row.uid;

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
