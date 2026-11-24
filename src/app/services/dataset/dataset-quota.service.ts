import { Injectable, inject } from '@angular/core';
import { CallResponse } from '@truenas/api-client';
import {
  catchError, forkJoin, map, Observable, of, switchMap,
} from 'rxjs';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

type UserspaceType = 'user' | 'group';
type UserspaceRow = CallResponse<WebUiApiDirectory, 'zfs.resource.userspace.list'>[number];

/**
 * User and group quotas through `zfs.resource.userspace`, in the shape the quota pages are written against
 * (`pool.dataset.get_quota` / `set_quota`). `zfs.resource.userspace` speaks in uids and gids, so names are looked
 * up here, the way middleware's `pool.dataset` wrapper does.
 */
@Injectable({ providedIn: 'root' })
export class DatasetQuotaService {
  private api = inject(ApiService);

  /**
   * The user or group quotas on `path`. A row whose account no longer exists has a `null` name, which the quota list
   * offers to remove.
   *
   * Every row needs a name, and accounts outside the local database cost a call each, so usage-only rows (an owner
   * of files with no limit set, possibly thousands of them) are left out unless `includeUsageOnly` asks for them.
   */
  getQuotas(
    path: string,
    quotaType: DatasetQuotaType.User | DatasetQuotaType.Group,
    { includeUsageOnly = false }: { includeUsageOnly?: boolean } = {},
  ): Observable<DatasetQuota[]> {
    return this.listRows(path, quotaType).pipe(
      map((rows) => (includeUsageOnly ? rows : rows.filter(hasLimit))),
      switchMap((rows) => this.withNames(rows, quotaType)),
    );
  }

  /** The quota of one user or group on `path`, or none. Only that account is looked up. */
  getQuota(
    path: string,
    quotaType: DatasetQuotaType.User | DatasetQuotaType.Group,
    xid: number,
  ): Observable<DatasetQuota[]> {
    return this.listRows(path, quotaType).pipe(
      map((rows) => rows.filter((row) => row.xid === xid)),
      switchMap((rows) => this.withNames(rows, quotaType)),
    );
  }

  /** How many users or groups have a quota on `path`. Needs no name lookups. */
  countQuotas(path: string, quotaType: DatasetQuotaType.User | DatasetQuotaType.Group): Observable<number> {
    return this.listRows(path, quotaType).pipe(map((rows) => rows.filter(hasLimit).length));
  }

  private listRows(path: string, quotaType: DatasetQuotaType): Observable<UserspaceRow[]> {
    return this.api.call('zfs.resource.userspace.list', [{ paths: [path], types: [toUserspaceType(quotaType)] }]);
  }

  private withNames(rows: UserspaceRow[], quotaType: DatasetQuotaType): Observable<DatasetQuota[]> {
    const xids = [...new Set(rows.map((row) => row.xid))];
    if (!xids.length) {
      return of([]);
    }
    return this.getNames(toUserspaceType(quotaType), xids).pipe(
      map((namesById) => {
        return rows.map((row): DatasetQuota => ({
          id: row.xid,
          name: namesById.get(row.xid) ?? null,
          quota_type: quotaType,
          quota: row.quota,
          used_bytes: row.used,
          used_percent: row.quota ? row.used / row.quota * 100 : 0,
          obj_quota: row.objquota,
          obj_used: row.objused,
        }));
      }),
    );
  }

  /**
   * Sets user and group quotas given as `pool.dataset.set_quota` rows: `id` is a uid/gid or a name, and the
   * `*OBJ` types set the object quota. A value of 0 removes the limit.
   */
  setQuotas(path: string, quotas: SetDatasetQuota[]): Observable<null> {
    if (!quotas.length) {
      return of(null);
    }
    return forkJoin(quotas.map((quota) => this.getId(toUserspaceType(quota.quota_type), quota.id))).pipe(
      switchMap((xids) => {
        const items = new Map<string, { type: UserspaceType; xid: number; quota?: number; objquota?: number }>();
        quotas.forEach((quota, i) => {
          const type = toUserspaceType(quota.quota_type);
          const key = `${type}:${xids[i]}`;
          const item = items.get(key) ?? { type, xid: xids[i] };
          const isObjectQuota = quota.quota_type === DatasetQuotaType.UserObj
            || quota.quota_type === DatasetQuotaType.GroupObj;
          if (isObjectQuota) {
            item.objquota = quota.quota_value || 0;
          } else {
            item.quota = quota.quota_value || 0;
          }
          items.set(key, item);
        });
        const [first, ...rest] = [...items.values()];
        return this.api.call('zfs.resource.userspace.set', [{ path, quotas: [first, ...rest] }]);
      }),
    );
  }

  /**
   * Names for many ids at once. Local accounts come from one `user.query` / `group.query`; only the ids it doesn't
   * return (directory-service accounts, or ones that no longer exist) are looked up one by one.
   */
  private getNames(type: UserspaceType, xids: number[]): Observable<Map<number, string | null>> {
    const known$: Observable<Map<number, string>> = type === 'user'
      ? this.api.query('user.query', [['uid', 'in', xids]], { select: ['uid', 'username'] }).pipe(
          map((users) => new Map(users.map((user) => [user.uid, user.username]))),
        )
      : this.api.query('group.query', [['gid', 'in', xids]], { select: ['gid', 'group'] }).pipe(
          map((groups) => new Map(groups.map((group) => [group.gid, group.group]))),
        );

    return known$.pipe(
      // Without the role to list accounts, every id is looked up on its own, as before.
      catchError(() => of(new Map<number, string>())),
      switchMap((known) => {
        const unknown = xids.filter((xid) => !known.has(xid));
        if (!unknown.length) {
          return of(new Map<number, string | null>(known));
        }
        return forkJoin(unknown.map((xid) => this.getName(type, xid))).pipe(
          map((names) => new Map<number, string | null>([
            ...known,
            ...unknown.map((xid, i): [number, string | null] => [xid, names[i]]),
          ])),
        );
      }),
    );
  }

  /** `null` when the account doesn't exist; the id itself when it can't be looked up, e.g. for lack of a role. */
  private getName(type: UserspaceType, xid: number): Observable<string | null> {
    const name$ = type === 'user'
      ? this.api.call('user.get_user_obj', [{ uid: xid }]).pipe(map((user) => user.pw_name))
      : this.api.call('group.get_group_obj', [{ gid: xid }]).pipe(map((group) => group.gr_name));
    return name$.pipe(
      catchError((error: unknown) => of(isMissingAccount(error) ? null : String(xid))),
    );
  }

  private getId(type: UserspaceType, idOrName: string): Observable<number> {
    if (/^\d+$/.test(idOrName)) {
      return of(Number(idOrName));
    }
    return type === 'user'
      ? this.api.call('user.get_user_obj', [{ username: idOrName }]).pipe(map((user) => user.pw_uid))
      : this.api.call('group.get_group_obj', [{ groupname: idOrName }]).pipe(map((group) => group.gr_gid));
  }
}

/** A row with a data or object limit, as opposed to one that only reports usage. */
function hasLimit(row: UserspaceRow): boolean {
  return row.quota > 0 || row.objquota > 0;
}

function toUserspaceType(quotaType: DatasetQuotaType): UserspaceType {
  return quotaType === DatasetQuotaType.Group || quotaType === DatasetQuotaType.GroupObj ? 'group' : 'user';
}

/** `user.get_user_obj` and `group.get_group_obj` answer an unknown id with "… does not exist". */
function isMissingAccount(error: unknown): boolean {
  const details = extractApiErrorDetails(error);
  return Boolean(details?.reason?.includes('does not exist'));
}
