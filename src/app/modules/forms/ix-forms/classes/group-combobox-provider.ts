import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

interface GroupComboboxOptions {
  valueField?: 'group' | 'gid' | 'id';
  initialOptions?: Option[];
  queryType?: 'default' | 'smb';
}

export class GroupComboboxProvider implements IxComboboxProvider {
  protected page = 1;
  readonly pageSize = 50;
  private valueField: 'group' | 'gid' | 'id';
  private initialOptions: Option[];
  private queryType: 'default' | 'smb';

  constructor(
    protected userService: UserService,
    options: GroupComboboxOptions = {},
  ) {
    this.valueField = options.valueField ?? 'group';
    this.initialOptions = options.initialOptions ?? [];
    this.queryType = options.queryType ?? 'default';
  }

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return this.queryGroups()(filterValue, false, offset).pipe(
      map((groups) => this.groupQueryResToOptions(groups)),
      map((options) => [...this.initialOptions, ...this.excludeInitialOptions(options)]),
    );
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return this.queryGroups()(filterValue, false, offset).pipe(
      map((groups) => this.groupQueryResToOptions(groups)),
      map((groups) => this.excludeInitialOptions(groups)),
    );
  }

  private queryGroups(): (filterValue: string, flag: boolean, offset: number) => Observable<Group[]> {
    return this.queryType === 'smb'
      ? this.userService.smbGroupQueryDsCache.bind(this.userService)
      : this.userService.groupQueryDsCache.bind(this.userService);
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
