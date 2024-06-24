import { Observable, map } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { UserService } from 'app/services/user.service';

export class SmbGroupComboboxProvider extends GroupComboboxProvider {
  constructor(
    userService: UserService,
    optionsValueField: 'group' | 'gid' | 'id' = 'group',
    initialOptions: Option[] = [],
  ) {
    super(
      userService,
      optionsValueField,
      initialOptions,
    );
  }

  override fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return this.userService.smbGroupQueryDsCache(filterValue, false, offset)
      .pipe(
        map((groups) => this.groupQueryResToOptions(groups)),
        map((options) => [...this.initialOptions, ...this.excludeInitialOptions(options)]),
      );
  }

  override nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return this.userService.smbGroupQueryDsCache(filterValue, false, offset)
      .pipe(
        map((groups) => this.groupQueryResToOptions(groups)),
        map((options) => this.excludeInitialOptions(options)),
      );
  }
}
