import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, ChangeDetectionStrategy,
  signal, computed, inject,
  output,
  input,
  effect,
} from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { injectParams } from 'ngxtension/inject-params';
import { EmptyType } from 'app/enums/empty-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { User } from 'app/interfaces/user.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { UserRowComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-row/user-row.component';
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';

@UntilDestroy()
@Component({
  selector: 'ix-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    EmptyComponent,
    UserRowComponent,
    SearchInput1Component,
    MatCheckbox,
    FakeProgressBarComponent,
  ],
})
export class UserListComponent {
  readonly userName = injectParams('id');
  readonly isMobileView = input<boolean>();
  readonly toggleShowMobileDetails = output<boolean>();

  protected readonly selection = new SelectionModel<string>(true, []);

  protected readonly searchQuery = signal<string>('');
  protected readonly window = inject<Window>(WINDOW);

  protected readonly users = this.usersStore.users;
  protected readonly isLoading = this.usersStore.isLoading;

  protected readonly selectedUser = this.usersStore.selectedUser;

  protected readonly filteredUsers = computed(() => {
    return (this.users() || []).filter((user) => {
      return user?.username?.toLocaleLowerCase().includes(this.searchQuery().toLocaleLowerCase());
    });
  });

  protected readonly emptyConfig = computed<EmptyConfig>(() => {
    if (this.searchQuery()?.length && !this.filteredUsers()?.length) {
      return {
        type: EmptyType.NoSearchResults,
        title: this.translate.instant('No Search Results.'),
        message: this.translate.instant('No matching results found'),
        large: false,
      };
    }
    return {
      type: EmptyType.NoPageData,
      title: this.translate.instant('No users found'),
      message: this.translate.instant('Users will appear here once created.'),
      large: true,
    };
  });

  get isAllSelected(): boolean {
    return this.selection.selected.length === this.filteredUsers().length;
  }

  get checkedInstances(): User[] {
    return this.selection.selected
      .map((username) => {
        return this.users().find((user) => user.username === username);
      })
      .filter((user) => !!user);
  }

  constructor(
    private usersStore: UsersStore,
    private router: Router,
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
    this.router.navigate(['/credentials/users-new', 'view', user.username]);

    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(true);
    }
  }

  toggleAllChecked(checked: boolean): void {
    if (checked) {
      this.users().forEach((user) => this.selection.select(user.username));
    } else {
      this.selection.clear();
    }
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
