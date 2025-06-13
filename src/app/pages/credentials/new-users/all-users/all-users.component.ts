import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
  viewChild, OnDestroy,
  signal,
  computed,
  Signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest, filter, startWith, tap,
} from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CollectionChangeType } from 'app/enums/api.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
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
  private defaultParams = [[['OR', [['builtin', '=', false], ['username', '=', 'root']]]]] as QueryParams<User>;
  protected dataProvider: Signal<ApiDataProvider<'user.query'>> = computed(() => {
    const dataProvider = new ApiDataProvider(this.api, 'user.query', this.defaultParams);
    dataProvider.paginationStrategy = new PaginationServerSide();
    dataProvider.sortingStrategy = new SortingServerSide();
    dataProvider.setSorting({
      propertyName: 'uid',
      direction: SortDirection.Asc,
      active: 1,
    });
    dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((users) => {
      dataProvider.expandedRow = this.masterDetailView().isMobileView() ? null : users[0];
    });
    dataProvider.load();
    return dataProvider;
  });

  protected readonly searchableElements = allUsersElements;
  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);
  protected readonly selectedUser = signal<User>(null);

  constructor(
    private api: ApiService,
  ) { }

  ngOnInit(): void {
    this.subscribeToUserChanges();
  }

  ngOnDestroy(): void {
    this.dataProvider().unsubscribe();
  }

  private subscribeToUserChanges(): void {
    combineLatest([
      this.api.subscribe('user.query').pipe(startWith(null)),
      this.dataProvider().currentPage$,
    ]).pipe(
      tap(([event, users]) => {
        switch (event?.msg) {
          case CollectionChangeType.Changed:
            this.dataProvider().currentPage$.next(
              users.map((item) => (item.id === event.id ? { ...item, ...event?.fields } : item)),
            );
            break;
          case CollectionChangeType.Removed:
          case CollectionChangeType.Added:
            this.dataProvider().load();
            break;
          default:
            break;
        }
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
