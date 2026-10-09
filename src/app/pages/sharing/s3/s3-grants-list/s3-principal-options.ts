import { TnOptionsFetchFn } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { S3PrincipalType } from 'app/enums/s3.enum';
import { Option } from 'app/interfaces/option.interface';
import { TypedQueryFilter, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

/** Rows fetched per page. Bound to the picker's `[pageSize]` so it can detect exhaustion. */
export const s3PrincipalPageSize = 50;

/**
 * Users or groups an S3 grant may name, as uid or gid. Built-in system accounts are left out,
 * since an S3 principal is always a real account that signs requests with an access key.
 *
 * Returns a `tn-autocomplete` data source: the picker owns the paging cursor and passes the page
 * in, so this holds no state of its own. The option for a principal already on the grant is
 * pinned through the picker's `[options]` instead of being spliced into page 0.
 */
export function s3PrincipalOptions(
  api: TypedApiService,
  kind: S3PrincipalType.User | S3PrincipalType.Group,
): TnOptionsFetchFn<Option> {
  return (search: string, page: number): Observable<Option[]> => {
    const trimmed = search?.trim() ?? '';
    // The middleware treats the filter as a pattern, so a typed metacharacter must match literally.
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const options = { offset: page * s3PrincipalPageSize, limit: s3PrincipalPageSize };

    if (kind === S3PrincipalType.User) {
      const filters: TypedQueryFilter<WebUiQueryEntity<'user.query'>>[] = [['builtin', '=', false]];
      if (trimmed) {
        filters.push(['username', '~', `(?i).*${escaped}`]);
      }
      return api.query('user.query', filters, { ...options, order_by: ['username'] }).pipe(
        map((users) => users.map((user) => ({ label: user.username, value: user.uid }))),
      );
    }

    const filters: TypedQueryFilter<WebUiQueryEntity<'group.query'>>[] = [['builtin', '=', false]];
    if (trimmed) {
      filters.push(['group', '~', `(?i).*${escaped}`]);
    }
    return api.query('group.query', filters, { ...options, order_by: ['group'] }).pipe(
      map((groups) => groups.map((group) => ({ label: group.group, value: group.gid }))),
    );
  };
}
