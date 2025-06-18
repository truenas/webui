import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
  viewChild, OnDestroy,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { injectParams } from 'ngxtension/inject-params';
import {
  combineLatest, filter, startWith, tap,
} from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { User } from 'app/interfaces/user.interface';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllUsersHeaderComponent } from 'app/pages/credentials/new-users/all-users/all-users-header/all-users-header.component';
import { allUsersElements } from 'app/pages/credentials/new-users/all-users/all-users.elements';
import { UserDetailHeaderComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-detail-header/user-detail-header.component';
import { UserDetailsComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-details.component';
import { UserListComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-list.component';
import { UsersDataProvider } from 'app/pages/credentials/new-users/all-users/users-data-provider';

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
    AsyncPipe,
    PageHeaderComponent,
    AllUsersHeaderComponent,
    UserDetailsComponent,
    UserListComponent,
    MasterDetailViewComponent,
    UserDetailHeaderComponent,
  ],
})
export class AllUsersComponent implements OnInit, OnDestroy {
  protected dataProvider: UsersDataProvider;
  private readonly userName = injectParams('id');

  protected readonly searchableElements = allUsersElements;
  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);
  protected readonly selectedUser = signal<User>(null);

  private navigationInProgress = false;

  constructor(
    private api: ApiService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.createDataProvider();
    this.subscribeToUserChanges();
  }

  ngOnDestroy(): void {
    this.dataProvider.unsubscribe();
  }

  private createDataProvider(): void {
    this.dataProvider = new UsersDataProvider(this.api);
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.dataProvider.setSorting({
      propertyName: 'uid',
      direction: SortDirection.Asc,
      active: 1,
    });

    const urlUsername = this.userName();
    if (urlUsername) {
      this.dataProvider.setPriorityUsername(urlUsername);
    }

    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((users: User[]) => {
      this.dataProvider.expandedRow = this.masterDetailView().isMobileView() ? null : users[0];
      this.handleInitialUserSelection(users);
    });
    this.dataProvider.load();
  }

  private subscribeToUserChanges(): void {
    combineLatest([
      this.api.subscribe('user.query').pipe(startWith(null)),
      this.dataProvider.currentPage$,
    ]).pipe(
      tap(([event, users]: [ApiEvent<User> | null, User[]]) => {
        switch (event?.msg) {
          case CollectionChangeType.Changed:
            this.dataProvider.currentPage$.next(
              users.map((item: User) => (item.id === event.id ? { ...item, ...event.fields } : item)),
            );
            break;
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
    if (!user || this.navigationInProgress) {
      return;
    }

    this.navigationInProgress = true;
    this.selectedUser.set(user);

    this.router.navigate(['/credentials', 'users-new', 'view', user.username]).finally(() => {
      this.navigationInProgress = false;
    });
  }

  private handleInitialUserSelection(users: User[]): void {
    if (this.navigationInProgress || !users.length) {
      return;
    }

    const urlUsername = this.userName();

    if (urlUsername) {
      const targetUser = users.find((user) => user.username === urlUsername);
      if (targetUser) {
        this.selectedUser.set(targetUser);
      } else {
        this.selectedUser.set(users[0]);
      }
    } else {
      this.selectedUser.set(users[0]);
    }
  }
}
