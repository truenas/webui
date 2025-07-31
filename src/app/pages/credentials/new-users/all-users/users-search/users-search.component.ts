import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, signal, OnInit, inject, computed, effect,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, map } from 'rxjs';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { ParamsBuilder, ParamsBuilderGroup } from 'app/helpers/params-builder/params-builder.class';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { FilterPreset, QueryFilters, QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { booleanProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UsersDataProvider } from 'app/pages/credentials/new-users/all-users/users-data-provider';
import { getDefaultPresets, getBuiltinTogglePreset, getActiveDirectoryTogglePreset } from './users-search-presets';

const searchDebounceTime = 250;

enum UserType {
  Builtin = 'builtin',
  Local = 'local',
  Directory = 'directory',
}

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
    FormsModule,
    SearchInputComponent,
    IxSelectComponent,
    TranslateModule,
    TestDirective,
  ],
})

export class UsersSearchComponent implements OnInit {
  private translate = inject(TranslateService);

  protected readonly advancedSearchPlaceholder = this.translate.instant('Username = "root" AND "Built in" = "Yes"');

  readonly dataProvider = input.required<UsersDataProvider>();

  protected readonly searchQuery = signal<SearchQuery<User>>({
    query: '',
    isBasicQuery: true,
  });

  protected readonly searchProperties = signal<SearchProperty<User>[]>([]);

  protected selectedUserTypes: UserType[] = [UserType.Local];

  protected readonly userPresets = signal<FilterPreset<User>[]>([]);
  private readonly isBuiltinFilterActive = signal<boolean>(false);
  private readonly isActiveDirectoryFilterActive = signal<boolean>(false);

  private readonly userTypeOptionsSignal = computed(() => {
    const options: SelectOption[] = [
      { label: this.translate.instant('Built-In'), value: UserType.Builtin },
      { label: this.translate.instant('Local'), value: UserType.Local },
    ];

    if (this.isActiveDirectoryEnabled()) {
      options.push({ label: this.translate.instant('Directory Services'), value: UserType.Directory });
    }

    return options;
  });

  protected readonly userTypeOptions$ = toObservable(this.userTypeOptionsSignal);

  private readonly api = inject(ApiService);
  private readonly isActiveDirectoryEnabled = toSignal(this.api.call('directoryservices.status').pipe(
    map((state: DirectoryServicesStatus) => state.status !== DirectoryServiceStatus.Disabled),
  ));

  private lastProcessedQuery = signal<SearchQuery<User> | null>(null);

  constructor() {
    this.updateBuiltinActiveState();

    effect(() => {
      const isAdEnabled = this.isActiveDirectoryEnabled();
      if (isAdEnabled !== undefined) {
        this.updateUserPresets();
      }
    });
  }

  ngOnInit(): void {
    this.updateBuiltinActiveState();
    this.setSearchProperties(this.dataProvider().currentPage$.getValue());
  }

  private setSearchProperties(users: User[]): void {
    const groups = this.extractUniqueGroups(users);
    const roles = this.extractUniqueRoles(users);
    this.searchProperties.update(() => searchProperties<User>([
      textProperty('id', this.translate.instant('ID'), of([] as Option[])),
      textProperty('username', this.translate.instant('Username'), of([] as Option[])),
      textProperty(
        'fullname',
        this.translate.instant('Full Name'),
        of(this.createOptionsFromUserProperty(users, 'full_name')),
      ),
      textProperty(
        'email',
        this.translate.instant('Email'),
        of(this.createOptionsFromUserProperty(users, 'email')),
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
        of(this.createOptionsFromUserProperty(users, 'home')),
      ),
      textProperty(
        'shell',
        this.translate.instant('Shell'),
        of(this.createOptionsFromUserProperty(users, 'shell')),
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

  private extractUniqueGroups(users: User[]): Set<string> {
    const groups = new Set<string>();

    users.forEach((user) => {
      if (user?.group?.id) {
        groups.add(user.group.id.toString());
      }

      user.groups?.forEach((group) => {
        groups.add(group.toString());
      });
    });

    return groups;
  }

  private extractUniqueRoles(users: User[]): Set<Role> {
    const roles = new Set<Role>();

    users.forEach((user) => {
      user.roles?.forEach((role) => {
        roles.add(role);
      });
    });

    return roles;
  }

  private createOptionsFromUserProperty(users: User[], property: keyof User): Option[] {
    return users
      .filter((user) => Boolean(user[property]))
      .map((user) => ({
        label: String(user[property]),
        value: String(user[property]),
      }));
  }

  protected onSearch(query: SearchQuery<User>): void {
    if (!query) {
      return;
    }

    this.searchQuery.set(query);

    if (query.isBasicQuery) {
      let params = new ParamsBuilder<User>();

      if (query.query) {
        const term = `(?i)${query.query}`;
        params = params
          .filter('username', '~', term)
          .orFilter('full_name', '~', term);
      }

      const selectedTypes = this.selectedUserTypes;
      if (selectedTypes.length > 0 && selectedTypes.length < this.userTypeOptionsSignal().length) {
        params = this.addUserTypeFilters(params, selectedTypes);
      }

      this.dataProvider().setParams(params.getParams());
    } else {
      const advancedFilters = (query as AdvancedSearchQuery<User>).filters;
      this.dataProvider().setParams([advancedFilters]);
    }

    this.dataProvider().load();
  }

  protected onUserTypeChange(selectedTypes: UserType[]): void {
    this.selectedUserTypes = selectedTypes;
    this.onSearch(this.searchQuery());
  }

  private queriesEqual(query1: SearchQuery<User> | null, query2: SearchQuery<User>): boolean {
    if (!query1 || query1.isBasicQuery !== query2.isBasicQuery) {
      return false;
    }

    if (query1.isBasicQuery && query2.isBasicQuery) {
      return query1.query === query2.query;
    }

    const advQuery1 = query1 as AdvancedSearchQuery<User>;
    const advQuery2 = query2 as AdvancedSearchQuery<User>;
    return this.filtersEqual(advQuery1.filters, advQuery2.filters);
  }

  private filtersEqual(filters1: QueryFilters<User>, filters2: QueryFilters<User>): boolean {
    if (filters1.length !== filters2.length) {
      return false;
    }

    return filters1.every((filter1, index) => {
      const filter2 = filters2[index];

      if (Array.isArray(filter1) && Array.isArray(filter2)) {
        return filter1.length === filter2.length
          && filter1.every((item, i) => item === filter2[i]);
      }

      return filter1 === filter2;
    });
  }

  private addUserTypeFilters(params: ParamsBuilder<User>, selectedTypes: UserType[]): ParamsBuilder<User> {
    if (selectedTypes.length === 1) {
      const [type] = selectedTypes;
      return this.applySingleUserTypeFilter(params, type);
    }

    if (selectedTypes.length > 1) {
      return params.andGroup((group: ParamsBuilderGroup<User>) => {
        selectedTypes.forEach((type, index) => {
          this.applyUserTypeToGroup(group, type, index === 0);
        });
      });
    }

    return params;
  }

  private applySingleUserTypeFilter(params: ParamsBuilder<User>, type: UserType): ParamsBuilder<User> {
    switch (type) {
      case UserType.Builtin:
        return params.andFilter('builtin', '=', true);
      case UserType.Local:
        return params.andGroup((group) => {
          group.filter('local', '=', true).andFilter('builtin', '=', false);
          group.orFilter('username', '=', 'root');
        });
      case UserType.Directory:
        return params.andFilter('local', '=', false).andFilter('builtin', '=', false);
      default:
        return params;
    }
  }

  private applyUserTypeToGroup(group: ParamsBuilderGroup<User>, type: UserType, isFirst: boolean): void {
    switch (type) {
      case UserType.Builtin:
        if (isFirst) {
          group.filter('builtin', '=', true);
        } else {
          group.orFilter('builtin', '=', true);
        }
        break;
      case UserType.Local:
        if (isFirst) {
          group.group((subGroup: ParamsBuilderGroup<User>) => {
            subGroup.group((innerGroup: ParamsBuilderGroup<User>) => {
              innerGroup.filter('local', '=', true).andFilter('builtin', '=', false);
              innerGroup.orFilter('username', '=', 'root');
            });
          });
        } else {
          group.orGroup((subGroup: ParamsBuilderGroup<User>) => {
            subGroup.group((innerGroup: ParamsBuilderGroup<User>) => {
              innerGroup.filter('local', '=', true).andFilter('builtin', '=', false);
              innerGroup.orFilter('username', '=', 'root');
            });
          });
        }
        break;
      case UserType.Directory:
        if (isFirst) {
          group.group((subGroup: ParamsBuilderGroup<User>) => {
            subGroup.filter('local', '=', false).andFilter('builtin', '=', false);
          });
        } else {
          group.orGroup((subGroup: ParamsBuilderGroup<User>) => {
            subGroup.filter('local', '=', false).andFilter('builtin', '=', false);
          });
        }
        break;
    }
  }

  protected onQueryChange(query: SearchQuery<User>): void {
    if (!query.isBasicQuery) {
      const originalQuery = query as AdvancedSearchQuery<User>;
      query = this.removeConflictingFilters(originalQuery);

      const lastQuery = this.lastProcessedQuery();
      if (!this.queriesEqual(lastQuery, query)) {
        this.lastProcessedQuery.set(query);
        setTimeout(() => {
          this.onSearch(query);
        }, searchDebounceTime);
      }
    }

    this.searchQuery.set(query);
    this.updateBuiltinActiveState();
  }

  private removeConflictingFilters(query: AdvancedSearchQuery<User>): AdvancedSearchQuery<User> {
    const builtinFilters: QueryFilter<User>[] = [];
    const localFilters: QueryFilter<User>[] = [];
    const otherFilters: QueryFilters<User> = [];

    query.filters.forEach((filterItem) => {
      if (Array.isArray(filterItem) && filterItem.length === 3) {
        const [property] = filterItem;
        if (property === 'builtin') {
          builtinFilters.push(filterItem as QueryFilter<User>);
        } else if (property === 'local') {
          localFilters.push(filterItem as QueryFilter<User>);
        } else {
          otherFilters.push(filterItem);
        }
      } else {
        otherFilters.push(filterItem);
      }
    });

    if (builtinFilters.length > 0) {
      otherFilters.push(builtinFilters[builtinFilters.length - 1]);
    }

    if (localFilters.length > 0) {
      otherFilters.push(localFilters[localFilters.length - 1]);
    }

    return {
      ...query,
      filters: otherFilters,
    };
  }

  private updateBuiltinActiveState(): void {
    const currentQuery = this.searchQuery();
    let hasBuiltinTrue = false;
    let hasLocalTrue = false;

    if (!currentQuery.isBasicQuery) {
      const advancedQuery = currentQuery as AdvancedSearchQuery<User>;
      advancedQuery.filters.forEach((filterItem) => {
        if (Array.isArray(filterItem) && filterItem.length === 3) {
          const [property, operator, value] = filterItem;
          if (property === 'builtin' && operator === '=' && value === true) {
            hasBuiltinTrue = true;
          }
          if (property === 'local' && operator === '=' && value === true) {
            hasLocalTrue = true;
          }
        }
      });
    }

    this.isBuiltinFilterActive.set(hasBuiltinTrue);
    this.isActiveDirectoryFilterActive.set(hasLocalTrue);
    this.updateUserPresets();
  }

  private updateUserPresets(): void {
    const presets = getDefaultPresets().map((preset) => ({
      ...preset,
      label: this.translate.instant(preset.label),
    }));

    const isBuiltinActive = this.isBuiltinFilterActive();
    const builtinPreset = getBuiltinTogglePreset(isBuiltinActive);
    presets.push({
      ...builtinPreset,
      label: this.translate.instant(builtinPreset.label),
    });

    const isAdEnabled = this.isActiveDirectoryEnabled();
    if (isAdEnabled) {
      const isActiveDirectoryActive = this.isActiveDirectoryFilterActive();
      const adPreset = getActiveDirectoryTogglePreset(isActiveDirectoryActive);
      presets.push({
        ...adPreset,
        label: this.translate.instant(adPreset.label),
      });
    }

    this.userPresets.set(presets);
  }
}
