import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

interface GroupComboboxOptions {
  valueField?: keyof Pick<Group, 'group' | 'gid' | 'id'>;
  initialOptions?: Option[];
  queryType?: ComboboxQueryType;
  localOnly?: boolean;
  excludedIds?: number[];
}

export class GroupComboboxProvider implements IxComboboxProvider {
  protected page = 0;
  readonly pageSize = 50;
  private valueField: keyof Pick<Group, 'group' | 'gid' | 'id'>;
  private initialOptions: Option[];
  private queryType: ComboboxQueryType;
  private localOnly: boolean;
  private excludedIds: number[];

  constructor(
    protected userService: UserService,
    options: GroupComboboxOptions = {},
  ) {
    this.valueField = options.valueField ?? 'group';
    this.initialOptions = options.initialOptions ?? [];
    this.queryType = options.queryType ?? ComboboxQueryType.Default;
    this.localOnly = options.localOnly ?? false;
    this.excludedIds = options.excludedIds ?? [];
  }

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    return this.queryGroups(filterValue);
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    return this.queryGroups(filterValue);
  }

  private queryGroups(filterValue: string): Observable<Option[]> {
    const offset = this.page * this.pageSize;

    let groups$: Observable<Group[]>;
    if (this.queryType === ComboboxQueryType.Smb) {
      // localOnly is intentionally not applied for SMB queries, as SMB groups may include directory service groups.
      groups$ = this.userService.smbGroupQueryDsCache(filterValue, false, offset);
    } else {
      const extraFilters: QueryFilter<Group>[] = [];
      if (this.localOnly) {
        extraFilters.push(['local', '=', true], ['immutable', '=', false]);
      }
      groups$ = this.userService.groupQueryDsCache(filterValue, false, offset, extraFilters);
    }

    return groups$.pipe(
      map((groups) => {
        if (this.excludedIds.length) {
          return groups.filter((group) => !this.excludedIds.includes(group.id));
        }
        return groups;
      }),
      map((groups) => this.groupQueryResToOptions(groups)),
      map((options) => [...this.initialOptions, ...this.excludeInitialOptions(options)]),
    );
  }

  private excludeInitialOptions(options: Option[]): Option[] {
    return options.filter((option) => !this.initialOptions.some((initial) => initial.value === option.value));
  }

  private groupQueryResToOptions(groups: Group[]): Option[] {
    return groups.map((group) => ({
      label: group.group,
      value: group[this.valueField],
    }));
  }
}
