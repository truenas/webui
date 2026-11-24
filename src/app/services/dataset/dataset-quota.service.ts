import { Injectable, inject } from '@angular/core';
import {
  catchError, forkJoin, map, Observable, of, switchMap,
} from 'rxjs';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { DatasetQuota, SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { ApiService } from 'app/modules/websocket/api.service';

type UserspaceType = 'user' | 'group';

/**
 * User and group quotas through `zfs.resource.userspace`, in the shape the quota pages are written against
 * (`pool.dataset.get_quota` / `set_quota`). `zfs.resource.userspace` speaks in uids and gids, so names are looked
 * up here, the way middleware's `pool.dataset` wrapper does.
 */
@Injectable({ providedIn: 'root' })
export class DatasetQuotaService {
  private api = inject(ApiService);

  /**
   * Every user or group quota row on `path`, usage-only rows included. A row whose account no longer exists has a
   * `null` name, which the quota list offers to remove.
   */
  getQuotas(path: string, quotaType: DatasetQuotaType.User | DatasetQuotaType.Group): Observable<DatasetQuota[]> {
    const type = toUserspaceType(quotaType);
    return this.api.call('zfs.resource.userspace.list', [{ paths: [path], types: [type] }]).pipe(
      switchMap((rows) => {
        const xids = [...new Set(rows.map((row) => row.xid))];
        if (!xids.length) {
          return of([]);
        }
        return forkJoin(xids.map((xid) => this.getName(type, xid))).pipe(
          map((names) => {
            const namesById = new Map(xids.map((xid, i) => [xid, names[i]]));
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

function toUserspaceType(quotaType: DatasetQuotaType): UserspaceType {
  return quotaType === DatasetQuotaType.Group || quotaType === DatasetQuotaType.GroupObj ? 'group' : 'user';
}

/** `user.get_user_obj` and `group.get_group_obj` answer an unknown id with "… does not exist". */
function isMissingAccount(error: unknown): boolean {
  const details = extractApiErrorDetails(error);
  return Boolean(details?.reason?.includes('does not exist'));
}
