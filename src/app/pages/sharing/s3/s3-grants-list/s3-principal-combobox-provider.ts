import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { S3PrincipalType } from 'app/enums/s3.enum';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { ApiService } from 'app/modules/websocket/api.service';

/**
 * Users or groups an S3 grant may name, as uid or gid. Built-in system accounts are left out,
 * since an S3 principal is always a real account that signs requests with an access key.
 */
export class S3PrincipalComboboxProvider implements IxComboboxProvider {
  private page = 0;
  readonly pageSize = 50;

  constructor(
    private api: ApiService,
    private kind: S3PrincipalType.User | S3PrincipalType.Group,
    /**
     * The option for a principal already on the grant, so it is labeled before the first query returns.
     */
    private initialOptions: Option[] = [],
  ) {}

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    return this.query(filterValue);
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    return this.query(filterValue);
  }

  private query(search: string): Observable<Option[]> {
    const trimmed = search?.trim() ?? '';
    const escaped = trimmed.replaceAll('\\', '\\\\');
    const options = { offset: this.page * this.pageSize, limit: this.pageSize };

    let options$: Observable<Option[]>;
    if (this.kind === S3PrincipalType.User) {
      const filters: QueryFilter<{ builtin: boolean; username: string }>[] = [['builtin', '=', false]];
      if (trimmed) {
        filters.push(['username', '~', `(?i).*${escaped}`]);
      }
      options$ = this.api.call('user.query', [filters, { ...options, order_by: ['username'] }]).pipe(
        map((users) => users.map((user) => ({ label: user.username, value: user.uid }))),
      );
    } else {
      const filters: QueryFilter<{ builtin: boolean; group: string }>[] = [['builtin', '=', false]];
      if (trimmed) {
        filters.push(['group', '~', `(?i).*${escaped}`]);
      }
      options$ = this.api.call('group.query', [filters, { ...options, order_by: ['group'] }]).pipe(
        map((groups) => groups.map((group) => ({ label: group.group, value: group.gid }))),
      );
    }

    return options$.pipe(
      map((fetched) => [
        ...this.initialOptions,
        ...fetched.filter((option) => !this.initialOptions.some((initial) => initial.value === option.value)),
      ]),
    );
  }
}
