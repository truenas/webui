import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

interface GroupComboboxOptions {
  valueField?: keyof Pick<Group, 'group' | 'gid' | 'id'>;
  initialOptions?: Option[];
  queryType?: ComboboxQueryType;
}

export class GroupComboboxProvider implements IxComboboxProvider {
  protected page = 1;
  readonly pageSize = 50;
  private valueField: keyof Pick<Group, 'group' | 'gid' | 'id'>;
  private initialOptions: Option[];
  private queryType: ComboboxQueryType;

  constructor(
    protected userService: UserService,
    options: GroupComboboxOptions = {},
  ) {
    this.valueField = options.valueField ?? 'group';
    this.initialOptions = options.initialOptions ?? [];
    this.queryType = options.queryType ?? ComboboxQueryType.Default;
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
    const queryMethod = this.queryType === ComboboxQueryType.Smb
      ? this.userService.smbGroupQueryDsCache
      : this.userService.groupQueryDsCache;

    return queryMethod.call(this.userService, filterValue, false, offset).pipe(
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
