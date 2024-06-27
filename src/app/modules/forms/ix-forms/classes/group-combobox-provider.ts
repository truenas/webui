import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services/user.service';

export class GroupComboboxProvider implements IxComboboxProvider {
  protected page = 1;
  readonly pageSize = 50;

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return this.userService.groupQueryDsCache(filterValue, false, offset)
      .pipe(
        map((groups) => this.groupQueryResToOptions(groups)),
        map((options) => [...this.initialOptions, ...this.excludeInitialOptions(options)]),
      );
  }

  excludeInitialOptions(options: Option[]): Option[] {
    return options.filter((option) => {
      return !this.initialOptions.find((initialOption) => initialOption.value === option.value);
    });
  }

  groupQueryResToOptions(groups: Group[]): Option[] {
    return groups.map((group) => {
      return { label: group.group, value: group[this.optionsValueField] };
    });
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return this.userService.groupQueryDsCache(filterValue, false, offset)
      .pipe(
        map((groups) => this.groupQueryResToOptions(groups)),
        map((groups) => this.excludeInitialOptions(groups)),
      );
  }

  constructor(
    protected userService: UserService,
    private optionsValueField: 'group' | 'gid' | 'id' = 'group',
    protected initialOptions: Option[] = [],
  ) {}
}
