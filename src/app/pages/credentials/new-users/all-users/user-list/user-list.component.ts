import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component, ChangeDetectionStrategy,
  output,
  input,
  effect,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { injectParams } from 'ngxtension/inject-params';
import { of } from 'rxjs';
import { roleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { UsersSearchComponent } from 'app/pages/credentials/new-users/all-users/users-search/users-search.component';
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    AsyncPipe,
    IxTableBodyComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTablePagerComponent,
    NgTemplateOutlet,
    UsersSearchComponent,
  ],
})
export class UserListComponent {
  readonly userName = injectParams('id');
  readonly searchQuery = injectParams<SearchQuery<User>>((params) => {
    return params.searchQuery;
  });

  readonly isMobileView = input<boolean>();
  readonly toggleShowMobileDetails = output<boolean>();
  protected readonly users = this.usersStore.users;
  protected readonly isLoading = this.usersStore.isLoading;
  protected readonly selectedUser = this.usersStore.selectedUser;

  readonly dataProvider = input.required<ApiDataProvider<'user.query'>>();

  protected columns = createTable<User>([
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
    textColumn({
      title: this.translate.instant('UID'),
      propertyName: 'uid',
    }),
    yesNoColumn({
      title: this.translate.instant('Builtin'),
      propertyName: 'builtin',
    }),
    textColumn({
      title: this.translate.instant('Full Name'),
      propertyName: 'full_name',
    }),
    textColumn({
      title: this.translate.instant('Roles'),
      getValue: (row) => row.roles
        .map((role) => this.translate.instant(roleNames.get(role) || role))
        .join(', ') || this.translate.instant('N/A'),
    }),
  ], {
    uniqueRowTag: (row) => 'user-' + row.username,
    ariaLabels: (row) => [row.username, this.translate.instant('User')],
  });

  readonly isSelectedUserVisible$ = of(true);
  // this.dataProvider().currentPage$.pipe(
  //   filter((users) => {
  //     const selectedUser = this.selectedUser();
  //     return users.some((user) => user.username === selectedUser.username);
  //   }),
  //   map((users) => Boolean(users.length))
  // );

  constructor(
    private usersStore: UsersStore,
    protected emptyService: EmptyService,
    private urlOptionsService: UrlOptionsService,
    private translate: TranslateService,
    private searchDirectives: UiSearchDirectivesService,
  ) {
    effect(() => {
      const userName = this.userName();
      const users = this.users();

      if (users?.length > 0) {
        if (userName && users.some((user) => user.username === userName)) {
          this.usersStore.selectUser(userName);
        } else {
          this.navigateToDetails(users[0]);
        }

        setTimeout(() => this.handlePendingGlobalSearchElement());
      }
    });
  }

  navigateToDetails(user: User): void {
    this.usersStore.selectUser(user.username);
    this.urlOptionsService.setUrlOptions(`/credentials/users-new/view/${user.username}`, {
      searchQuery: this.searchQuery(),
      sorting: this.dataProvider().sorting,
      pagination: this.dataProvider().pagination,
    });

    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(true);
    }
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }

  expanded(row: User): void {
    if (!row || !this.isMobileView()) return;
    this.toggleShowMobileDetails.emit(true);
  }
}
