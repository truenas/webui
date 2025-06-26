import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, signal, OnInit, inject, computed,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, of, forkJoin,
} from 'rxjs';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { ParamsBuilder, ParamsBuilderGroup } from 'app/helpers/params-builder/params-builder.class';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { FilterPreset, QueryFilters, QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, BasicSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { booleanProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserFilterPresets } from './user-filter-presets';

enum UserType {
  Builtin = 'builtin',
  Local = 'local',
  Directory = 'directory',
}

const searchDebounceTime = 100;

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
  protected readonly advancedSearchPlaceholder = this.translate.instant('Username = "root" AND "Built in" = "Yes"');

  readonly dataProvider = input.required<ApiDataProvider<'user.query'>>();

  protected readonly searchQuery = signal<SearchQuery<User>>({
    query: '',
    isBasicQuery: true,
  });

  protected readonly searchProperties = signal<SearchProperty<User>[]>([]);

  protected selectedUserTypes: UserType[] = [];

  protected readonly userPresets = signal<FilterPreset<User>[]>([]);
  private readonly isBuiltinFilterActive = signal<boolean>(false);

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

  private readonly filterPresets = new UserFilterPresets(this.translate);

  private readonly api = inject(ApiService);
  private readonly isActiveDirectoryEnabled = signal<boolean>(false);
  private lastProcessedQuery = signal<SearchQuery<User> | null>(null);

  constructor(
    private translate: TranslateService,
  ) {
    this.updateBuiltinActiveState();
  }

  ngOnInit(): void {
    forkJoin([
      this.api.call('directoryservices.get_state'),
      this.dataProvider().currentPage$.pipe(filter(Boolean)),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: ([servicesState, users]: [DirectoryServicesState, User[]]) => {
        this.isActiveDirectoryEnabled.set(servicesState.activedirectory !== DirectoryServiceState.Disabled);
        this.updateBuiltinActiveState();
        this.setSearchProperties(users);
      },
      error: (error: unknown) => {
        console.error('Failed to load directory services state or users:', error);
      },
    });
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

    console.info('Users search - onSearch called:', {
      isBasicQuery: query.isBasicQuery,
      query: query.isBasicQuery
        ? (query as BasicSearchQuery).query
        : (query as AdvancedSearchQuery<User>).filters,
      selectedUserTypes: this.selectedUserTypes,
    });

    this.searchQuery.set(query);

    if (query.isBasicQuery) {
      let params = new ParamsBuilder<User>();

      // Add text search if provided
      if (query.query) {
        const term = `(?i)${query.query}`;
        params = params
          .filter('username', '~', term)
          .orFilter('full_name', '~', term);
      }

      // Add user type filters
      const selectedTypes = this.selectedUserTypes;
      if (selectedTypes.length > 0 && selectedTypes.length < this.userTypeOptionsSignal().length) {
        params = this.addUserTypeFilters(params, selectedTypes);
      }

      const finalParams = params.getParams();
      console.info('Users search - Basic query params:', finalParams);

      this.dataProvider().setParams(finalParams);
    }

    if (!query.isBasicQuery) {
      const advancedFilters = (query as AdvancedSearchQuery<User>).filters;
      console.info('Users search - Advanced query filters:', advancedFilters);

      this.dataProvider().setParams([advancedFilters]);
    }

    this.dataProvider().load();
  }

  protected onUserTypeChange(selectedTypes: UserType[]): void {
    console.info('Users search - User type filter changed:', {
      previousTypes: this.selectedUserTypes,
      newTypes: selectedTypes,
    });

    this.selectedUserTypes = selectedTypes;
    this.onSearch(this.searchQuery());
  }

  private queriesEqual(query1: SearchQuery<User> | null, query2: SearchQuery<User>): boolean {
    console.info('Users search - queriesEqual comparison:', {
      query1: query1
        ? {
            isBasicQuery: query1.isBasicQuery,
            content: query1.isBasicQuery
              ? (query1 as BasicSearchQuery).query
              : (query1 as AdvancedSearchQuery<User>).filters,
          }
        : null,
      query2: {
        isBasicQuery: query2.isBasicQuery,
        content: query2.isBasicQuery
          ? (query2 as BasicSearchQuery).query
          : (query2 as AdvancedSearchQuery<User>).filters,
      },
    });

    if (!query1) {
      console.info('Users search - queriesEqual result: false (query1 is null)');
      return false;
    }

    if (query1.isBasicQuery !== query2.isBasicQuery) {
      console.info('Users search - queriesEqual result: false (different query types)');
      return false;
    }

    if (query1.isBasicQuery && query2.isBasicQuery) {
      const result = query1.query === query2.query;
      console.info('Users search - queriesEqual result:', result, '(basic query comparison)');
      return result;
    }

    // For advanced queries, compare filter arrays
    const advQuery1 = query1 as AdvancedSearchQuery<User>;
    const advQuery2 = query2 as AdvancedSearchQuery<User>;

    const result = this.filtersEqual(advQuery1.filters, advQuery2.filters);
    console.info('Users search - queriesEqual result:', result, '(advanced query comparison)');
    return result;
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
        return params.andFilter('local', '=', true).andFilter('builtin', '=', false);
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
            subGroup.filter('local', '=', true).andFilter('builtin', '=', false);
          });
        } else {
          group.orGroup((subGroup: ParamsBuilderGroup<User>) => {
            subGroup.filter('local', '=', true).andFilter('builtin', '=', false);
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
    console.info('Users search - onQueryChange called with:', {
      isBasicQuery: query.isBasicQuery,
      content: query.isBasicQuery ? (query as BasicSearchQuery).query : (query as AdvancedSearchQuery<User>).filters,
    });

    // Fix conflicting builtin filters if they exist
    if (!query.isBasicQuery) {
      const originalQuery = query as AdvancedSearchQuery<User>;
      query = this.removeConflictingBuiltinFilters(originalQuery);

      if (originalQuery !== query) {
        console.info('Users search - Query was modified by conflict resolution');
      }

      // Check if query has actually changed using signal comparison
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

  private removeConflictingBuiltinFilters(query: AdvancedSearchQuery<User>): AdvancedSearchQuery<User> {
    console.info('Users search - removeConflictingBuiltinFilters input:', query.filters);

    const builtinFilters: QueryFilter<User>[] = [];
    const otherFilters: QueryFilters<User> = [];

    // Separate builtin filters from other filters
    query.filters.forEach((filterItem, index) => {
      console.info(`Users search - Processing filter ${index}:`, filterItem);

      if (Array.isArray(filterItem) && filterItem.length === 3) {
        const [property, operator, value] = filterItem;
        if (property === 'builtin') {
          console.info('Users search - Found builtin filter:', { property, operator, value });
          builtinFilters.push(filterItem as QueryFilter<User>);
        } else {
          console.info('Users search - Found other filter:', { property, operator, value });
          otherFilters.push(filterItem);
        }
      } else {
        console.info('Users search - Found non-standard filter:', filterItem);
        otherFilters.push(filterItem);
      }
    });

    console.info('Users search - Separated filters:', {
      builtinFilters,
      otherFilters,
      builtinCount: builtinFilters.length,
    });

    // Keep only the last builtin filter (most recent)
    if (builtinFilters.length > 1) {
      console.info('Users search - CONFLICT DETECTED: Multiple builtin filters found!', {
        allBuiltinFilters: builtinFilters,
        keepingLast: builtinFilters[builtinFilters.length - 1],
      });
      otherFilters.push(builtinFilters[builtinFilters.length - 1]);
    } else if (builtinFilters.length === 1) {
      console.info('Users search - Single builtin filter found, keeping it:', builtinFilters[0]);
      otherFilters.push(builtinFilters[0]);
    } else {
      console.info('Users search - No builtin filters found');
    }

    const result = {
      ...query,
      filters: otherFilters,
    };

    console.info('Users search - removeConflictingBuiltinFilters result:', result.filters);
    return result;
  }

  private updateBuiltinActiveState(): void {
    const currentQuery = this.searchQuery();
    let hasBuiltinTrue = false;

    if (!currentQuery.isBasicQuery) {
      const advancedQuery = currentQuery as AdvancedSearchQuery<User>;
      hasBuiltinTrue = advancedQuery.filters.some((filterItem) => {
        if (Array.isArray(filterItem) && filterItem.length === 3) {
          const [property, operator, value] = filterItem;
          return property === 'builtin' && operator === '=' && value === true;
        }
        return false;
      });
    }

    this.isBuiltinFilterActive.set(hasBuiltinTrue);
    this.updateUserPresets();
  }

  private updateUserPresets(): void {
    const presets = [...this.filterPresets.getDefaultPresets()];

    // Add single dynamic builtin toggle preset
    const isActive = this.isBuiltinFilterActive();
    presets.push(this.filterPresets.getBuiltinTogglePreset(isActive));

    if (this.isActiveDirectoryEnabled()) {
      presets.push(this.filterPresets.getActiveDirectoryPreset());
    }

    this.userPresets.set(presets);
  }
}
