import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, signal, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { injectParams } from 'ngxtension/inject-params';
import { filter, of } from 'rxjs';
import { Role, roleNames } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { booleanProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-users-search',
  templateUrl: './users-search.component.html',
  styleUrl: './users-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FakeProgressBarComponent,
    MatButton,
    AsyncPipe,
    SearchInputComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class UsersSearchComponent implements OnInit {
  readonly userName = injectParams('id');
  protected readonly advancedSearchPlaceholder = this.translate.instant('Username = "root" AND Builtin = "Yes"');

  dataProvider = input.required<ApiDataProvider<'user.query'>>();

  protected searchQuery = signal<SearchQuery<User>>({
    query: '',
    isBasicQuery: true,
  });

  protected readonly searchProperties = signal<SearchProperty<User>[]>([]);

  constructor(
    private urlOptionsService: UrlOptionsService,
    private translate: TranslateService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.loadParamsFromRoute();

    this.dataProvider().sortingOrPaginationUpdate
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateUrlOptions();
      });

    this.dataProvider().currentPage$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: (users: User[]) => {
        this.setSearchProperties(users);
      },
    });
  }

  private setSearchProperties(users: User[]): void {
    const groups = new Set<string>();
    for (const user of users) {
      groups.add(user.group.id.toString());
      if (!user.groups) {
        continue;
      }
      for (const group of user.groups) {
        groups.add(group.toString());
      }
    }

    const roles = new Set<Role>();
    for (const user of users) {
      for (const role of user.roles) {
        roles.add(role);
      }
    }
    this.searchProperties.update(() => searchProperties<User>([
      textProperty('id', this.translate.instant('ID'), of([] as Option[])),
      textProperty('username', this.translate.instant('Username'), of([] as Option[])),
      textProperty(
        'fullname',
        this.translate.instant('Full Name'),
        of(
          users.filter(
            (user) => Boolean(user.full_name),
          ).map(
            (user) => ({ label: user.full_name, value: user.full_name }),
          ),
        ),
      ),
      textProperty(
        'email',
        this.translate.instant('Email'),
        of(
          users.filter(
            (user) => Boolean(user.email),
          ).map(
            (user) => ({ label: user.email, value: user.email }),
          ),
        ),
      ),
      booleanProperty('smb', this.translate.instant('SMB Enabled')),
      booleanProperty('builtin', this.translate.instant('Built-in')),
      booleanProperty('immutable', this.translate.instant('Immutable')),
      booleanProperty('password_disabled', this.translate.instant('Password Disabled')),
      booleanProperty('locked', this.translate.instant('Locked')),
      booleanProperty('local', this.translate.instant('Local')),
      booleanProperty('ssh_password_enabled', this.translate.instant('SSH Password Enabled')),
      textProperty(
        'home',
        this.translate.instant('Home Directory'),
        of(
          users.filter(
            (user) => Boolean(user.home),
          ).map(
            (user) => ({ label: user.home, value: user.home }),
          ),
        ),
      ),
      textProperty(
        'shell',
        this.translate.instant('Shell'),
        of(
          users.filter(
            (user) => Boolean(user.shell),
          ).map(
            (user) => ({ label: user.shell, value: user.shell }),
          ),
        ),
      ),
      textProperty(
        'group',
        this.translate.instant('Group'),
        of(Array.from(groups.values()).map((group) => ({ label: group, value: group }))),
      ),
      textProperty(
        'roles',
        this.translate.instant('Role'),
        of(Array.from(roles.values()).map((role) => ({ label: roleNames.get(role), value: role }))),
      ),
    ]));
  }

  updateUrlOptions(): void {
    const username = this.userName();
    const usernameUrlPostfix = username ? `/view/${username}` : '';
    this.urlOptionsService.setUrlOptions(`/credentials/users-new${usernameUrlPostfix}`, {
      searchQuery: this.searchQuery(),
      sorting: this.dataProvider().sorting,
      pagination: this.dataProvider().pagination,
    });
  }

  private loadParamsFromRoute(): void {
    this.activatedRoute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      const options = this.urlOptionsService.parseUrlOptions(params.options as string);

      this.dataProvider().setPagination({
        pageSize: options.pagination?.pageSize || 50,
        pageNumber: options.pagination?.pageNumber || 1,
      });

      if (options.sorting) this.dataProvider().setSorting(options.sorting);

      if (options.searchQuery) this.searchQuery.set(options.searchQuery as SearchQuery<User>);

      this.onSearch(this.searchQuery());
    });
  }

  onSearch(query: SearchQuery<User>): void {
    if (!query) {
      return;
    }

    this.searchQuery.set(query);

    if (query.isBasicQuery) {
      const term = `(?i)${query.query || ''}`;
      const params = new ParamsBuilder<User>()
        .filter('username', '~', term)
        .orFilter('full_name', '~', term)
        .getParams();

      // TODO: Incorrect cast, because of incorrect typing inside of DataProvider
      this.dataProvider().setParams(params);
    }

    if (!query.isBasicQuery) {
      // TODO: Incorrect cast, because of incorrect typing inside of DataProvider
      this.dataProvider().setParams(
        [(query as AdvancedSearchQuery<User>).filters],
      );
    }

    this.dataProvider().load();
  }
}
