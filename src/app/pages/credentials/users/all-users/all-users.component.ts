import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, viewChild, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { filter, startWith, tap } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CollectionChangeType } from 'app/enums/api.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllUsersHeaderComponent } from 'app/pages/credentials/users/all-users/all-users-header/all-users-header.component';
import { allUsersElements } from 'app/pages/credentials/users/all-users/all-users.elements';
import { UserDetailHeaderComponent } from 'app/pages/credentials/users/all-users/user-details/user-detail-header/user-detail-header.component';
import { UserDetailsComponent } from 'app/pages/credentials/users/all-users/user-details/user-details.component';
import { UserListComponent } from 'app/pages/credentials/users/all-users/user-list/user-list.component';
import { UsersDataProvider } from 'app/pages/credentials/users/all-users/users-data-provider';
import { setUsernameInUrl } from 'app/pages/credentials/users/router-utils';
import { userPageEntered } from 'app/pages/credentials/users/store/user.actions';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-all-users',
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    UiSearchDirective,
    PageHeaderComponent,
    AllUsersHeaderComponent,
    UserDetailsComponent,
    UserListComponent,
    MasterDetailViewComponent,
    UserDetailHeaderComponent,
  ],
})
export class AllUsersComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);

  private readonly defaultParams = [
    [['OR', [['builtin', '=', false], ['username', '=', 'root']]]],
  ] as QueryParams<User>;

  protected readonly dataProvider = new UsersDataProvider(this.api, this.defaultParams);

  protected readonly searchableElements = allUsersElements;
  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);

  ngOnInit(): void {
    this.store$.dispatch(userPageEntered());
    this.setupDataProvider();
    this.subscribeToUserChanges();
  }

  private setupDataProvider(): void {
    const urlUsername = this.activatedRoute.snapshot.queryParamMap.get('username') ?? null;
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.dataProvider.setSorting({
      propertyName: 'uid',
      direction: SortDirection.Asc,
      active: 0,
    });

    if (urlUsername) {
      this.dataProvider.shouldLoadUser(urlUsername);
    }

    this.dataProvider.currentPage$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((users) => {
      const name = (this.dataProvider.expandedRow?.username || urlUsername) ?? null;

      let selectedUser: User = this.dataProvider.expandedRow || null;

      if (!this.masterDetailView().isMobileView()) {
        selectedUser = name
          ? users.find((user) => user.username === name) ?? users[0]
          : users[0];
      }

      this.dataProvider.expandedRow = selectedUser;
      setUsernameInUrl(this.location, selectedUser?.username);
    });
    this.dataProvider.load();
  }

  ngOnDestroy(): void {
    this.dataProvider.unsubscribe();
  }

  private subscribeToUserChanges(): void {
    this.api.subscribe('user.query').pipe(startWith(null)).pipe(
      tap((event) => {
        switch (event?.msg) {
          case CollectionChangeType.Changed:
          case CollectionChangeType.Removed:
          case CollectionChangeType.Added:
            this.dataProvider.load();
            break;
          default:
            break;
        }
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  protected onUserSelected(user: User): void {
    if (!user) {
      return;
    }

    this.dataProvider.expandedRow = user;
    setUsernameInUrl(this.location, user.username);

    this.cdr.markForCheck();
  }

  protected loadNewUser(newUser: User): void {
    this.dataProvider.expandedRow = newUser;
    setUsernameInUrl(this.location, newUser?.username);
  }
}
