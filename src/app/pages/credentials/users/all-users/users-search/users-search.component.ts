import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, signal, OnInit, inject, computed, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  Subject, of, map, debounceTime, catchError,
} from 'rxjs';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { Role, roleNames } from 'app/enums/role.enum';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { QueryFilters, QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { booleanProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UsersDataProvider } from 'app/pages/credentials/users/all-users/users-data-provider';
import {
  getDefaultPresets, getBuiltinTogglePreset, getActiveDirectoryTogglePreset,
  UserType, buildUserTypeFilters,
} from './users-search-presets';

const searchDebounceTime = 250;

@Component({
  selector: 'ix-users-search',
  templateUrl: './users-search.component.html',
  styleUrl: './users-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FakeProgressBarComponent,
    MatButton,
    MatSlideToggle,
    MatTooltip,
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

  protected readonly selectedUserTypes = signal<UserType[]>([UserType.Local, UserType.Directory]);

  protected readonly showBuiltinUsers = signal<boolean>(false);

  /**
   * Computed signal that checks if builtin=true filter is active in advanced search.
   * Derived directly from searchQuery to avoid manual synchronization.
   */
  private readonly isBuiltinFilterActive = computed(() => {
    const query = this.searchQuery();
    if (query.isBasicQuery) return false;
    return (query as AdvancedSearchQuery<User>).filters.some(
      (filterItem) => Array.isArray(filterItem)
        && filterItem.length === 3
        && filterItem[0] === 'builtin'
        && filterItem[1] === '='
        && filterItem[2] === true,
    );
  });

  /**
   * Computed signal that checks if local=true filter is active in advanced search.
   * Derived directly from searchQuery to avoid manual synchronization.
   */
  private readonly isLocalFilterActive = computed(() => {
    const query = this.searchQuery();
    if (query.isBasicQuery) return false;
    return (query as AdvancedSearchQuery<User>).filters.some(
      (filterItem) => Array.isArray(filterItem)
        && filterItem.length === 3
        && filterItem[0] === 'local'
        && filterItem[1] === '='
        && filterItem[2] === true,
    );
  });

  /**
   * Computed signal for user presets based on current filter state.
   */
  protected readonly userPresets = computed(() => {
    const presets = getDefaultPresets().map((preset) => ({
      ...preset,
      label: this.translate.instant(preset.label),
    }));

    const builtinPreset = getBuiltinTogglePreset(this.isBuiltinFilterActive());
    presets.push({
      ...builtinPreset,
      label: this.translate.instant(builtinPreset.label),
    });

    const isAdEnabled = this.isActiveDirectoryEnabled();
    if (isAdEnabled) {
      const adPreset = getActiveDirectoryTogglePreset(this.isLocalFilterActive());
      presets.push({
        ...adPreset,
        label: this.translate.instant(adPreset.label),
      });
    }

    return presets;
  });

  private readonly userTypeOptions = computed(() => {
    const options: SelectOption[] = [
      { label: this.translate.instant('Local'), value: UserType.Local },
    ];

    if (this.isActiveDirectoryEnabled()) {
      options.push({ label: this.translate.instant('Directory Services'), value: UserType.Directory });
    }

    return options;
  });

  protected readonly isBuiltinCheckboxEnabled = computed(() => {
    return this.selectedUserTypes().includes(UserType.Local);
  });

  protected readonly builtinToggleTooltip = computed(() => {
    if (!this.isBuiltinCheckboxEnabled()) {
      return this.translate.instant('Available only when Local users are selected');
    }
    return '';
  });

  // Observable required by ix-select component
  protected readonly userTypeOptions$ = toObservable(this.userTypeOptions);

  private readonly api = inject(ApiService);
  private readonly isActiveDirectoryEnabled = toSignal(
    this.api.call('directoryservices.status').pipe(
      map((state: DirectoryServicesStatus) => state.status !== DirectoryServiceStatus.Disabled),
      catchError(() => of(false)),
    ),
    { initialValue: false },
  );

  private lastProcessedQuery = signal<SearchQuery<User> | null>(null);
  private readonly destroyRef = inject(DestroyRef);
  private readonly advancedSearchSubject$ = new Subject<SearchQuery<User>>();

  ngOnInit(): void {
    this.setSearchProperties(this.dataProvider().currentPage$.getValue());
    this.setupAdvancedSearchDebounce();
  }

  private setupAdvancedSearchDebounce(): void {
    this.advancedSearchSubject$.pipe(
      debounceTime(searchDebounceTime),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((query) => this.onSearch(query));
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
      const selectedTypes = this.selectedUserTypes();
      const typeFilters = buildUserTypeFilters(selectedTypes, this.showBuiltinUsers());

      let filters: QueryFilters<User> = [...typeFilters];

      if (query.query) {
        const pattern = this.convertToRegexPattern(query.query);
        const term = `(?i)${pattern}`;
        filters = [...filters, ['OR', [['username', '~', term], ['full_name', '~', term]]] as QueryFilters<User>[number]];
      }

      this.dataProvider().setParams([filters, {}]);
    } else {
      const advancedFilters = (query as AdvancedSearchQuery<User>).filters;
      this.dataProvider().setParams([advancedFilters]);
    }

    this.dataProvider().load();
  }

  protected onUserTypeChange(selectedTypes: UserType[]): void {
    this.selectedUserTypes.set(selectedTypes);
    if (!selectedTypes.includes(UserType.Local)) {
      this.showBuiltinUsers.set(false);
    }
    this.onSearch(this.searchQuery());
  }

  protected onShowBuiltinChange(showBuiltin: boolean): void {
    this.showBuiltinUsers.set(showBuiltin);
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
    return isEqual(filters1, filters2);
  }

  private convertToRegexPattern(term: string): string {
    // Escape all regex special characters except *
    const escaped = term.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
    // Convert * to .* for wildcard support
    return escaped.replace(/\*/g, '.*');
  }

  protected onQueryChange(query: SearchQuery<User>): void {
    const currentQuery = this.searchQuery();

    // Detect any mode switch and reset to mode-specific defaults
    if (currentQuery && currentQuery.isBasicQuery !== query.isBasicQuery) {
      const targetMode = query.isBasicQuery ? 'basic' : 'advanced';

      // Create empty query for the target mode to prevent preservation
      const emptyQuery: SearchQuery<User> = query.isBasicQuery
        ? { query: '', isBasicQuery: true }
        : { filters: [], isBasicQuery: false };

      this.searchQuery.set(emptyQuery);
      this.resetToModeDefaults(targetMode);
      return; // Exit early since resetToModeDefaults handles the filtering
    }

    if (!query.isBasicQuery) {
      const originalQuery = query as AdvancedSearchQuery<User>;
      query = this.removeConflictingFilters(originalQuery);

      const lastQuery = this.lastProcessedQuery();
      if (!this.queriesEqual(lastQuery, query)) {
        this.lastProcessedQuery.set(query);
        this.advancedSearchSubject$.next(query);
      }
      // Don't update searchQuery here - let onSearch handle it after debounce
      // to keep signal state consistent with actual search state
      return;
    }

    this.searchQuery.set(query);
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

  private resetToModeDefaults(targetMode: 'basic' | 'advanced'): void {
    if (targetMode === 'basic') {
      // Basic mode: show local and directory users by default
      this.dataProvider().setParams([]);
      this.selectedUserTypes.set([UserType.Local, UserType.Directory]);
      this.showBuiltinUsers.set(false);
      this.onUserTypeChange(this.selectedUserTypes());
    } else {
      // Advanced mode: show ALL users (no filtering)
      this.dataProvider().setParams([]);
      this.dataProvider().load();
    }
  }
}
