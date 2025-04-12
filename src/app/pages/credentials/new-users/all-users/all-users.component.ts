import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
  viewChild, OnDestroy,
} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { QueryFiltersAndOptionsApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/query-filters-and-options-data-provider';
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
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-users',
  templateUrl: './all-users.component.html',
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
  readonly selectedUser = this.usersStore.selectedUser;
  protected dataProvider: QueryFiltersAndOptionsApiDataProvider<'user.query'>;
  protected readonly searchableElements = allUsersElements;
  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);

  constructor(
    private usersStore: UsersStore,
    private api: ApiService,
    private router: Router,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this))
      .subscribe(() => {
        if (this.router.getCurrentNavigation()?.extras?.state?.hideMobileDetails) {
          this.usersStore.resetSelectedUser();
        }
      });
  }

  ngOnInit(): void {
    this.usersStore.initialize();
    this.createDataProvider();
  }

  ngOnDestroy(): void {
    this.dataProvider?.unsubscribe();
  }

  private createDataProvider(): void {
    this.dataProvider = new QueryFiltersAndOptionsApiDataProvider(this.api, 'user.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.dataProvider.setSorting({
      propertyName: 'uid',
      direction: SortDirection.Asc,
      active: 1,
    });
    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((auditEntries) => {
      this.dataProvider.expandedRow = this.masterDetailView().isMobileView() ? null : auditEntries[0];
    });
    this.dataProvider.load();
  }
}
