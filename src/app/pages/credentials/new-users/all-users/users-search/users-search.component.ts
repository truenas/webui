import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, signal, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, of } from 'rxjs';
import { Role, roleNames } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { Option } from 'app/interfaces/option.interface';
import { FilterPreset } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { booleanProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

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
  protected readonly advancedSearchPlaceholder = this.translate.instant('Username = "root" AND "Built in" = "Yes"');

  readonly dataProvider = input.required<ApiDataProvider<'user.query'>>();

  protected readonly searchQuery = signal<SearchQuery<User>>({
    query: '',
    isBasicQuery: true,
  });

  protected readonly searchProperties = signal<SearchProperty<User>[]>([]);

  protected userPresets: FilterPreset<User>[] = [
    {
      label: this.translate.instant('Show Builtin Users'),
      query: [['builtin', '=', true]],
    },
    {
      label: this.translate.instant('Has API Access'),
      query: [['api_keys', '!=', null]],
    },
    {
      label: this.translate.instant('Has SMB Access'),
      query: [['smb', '=', true]],
    },
    {
      label: this.translate.instant('Has Shell Access'),
      query: [['shell', '!=', null]],
    },
    {
      label: this.translate.instant('Has SSH Access'),
      query: [['sshpubkey', '!=', null]],
    },
    {
      label: this.translate.instant('From Active Directory'),
      query: [['local', '=', false]],
    },
  ];

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
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
      groups.add(user.group?.id.toString());
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
      booleanProperty('builtin', this.translate.instant('Built in')),
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

  protected onSearch(query: SearchQuery<User>): void {
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
