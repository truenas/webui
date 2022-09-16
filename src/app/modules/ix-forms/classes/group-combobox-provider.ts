import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox-provider';
import { UserService } from 'app/services';

export class GroupComboboxProvider implements IxComboboxProvider {
  private page = 1;
  readonly pageSize = 50;

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    const offset = this.page * this.pageSize;

    return this.userService.groupQueryDsCache(filterValue, false, offset)
      .pipe(map((groups) => this.groupQueryResToOptions(groups)));
  }

  groupQueryResToOptions(groups: Group[]): Option[] {
    return groups.map((group) => {
      return { label: group.group, value: group.group };
    });
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    const offset = this.page * this.pageSize;
    return this.userService.groupQueryDsCache(filterValue, false, offset)
      .pipe(
        map((groups) => this.groupQueryResToOptions(groups)),
      );
  }

  constructor(private userService: UserService) {}
}
