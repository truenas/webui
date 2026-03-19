import { Injectable, inject } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { ZfsTierConfig, ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class SharingTierService {
  private api = inject(ApiService);

  private tierConfig$: Observable<ZfsTierConfig>;

  getTierConfig(): Observable<ZfsTierConfig> {
    if (!this.tierConfig$) {
      this.tierConfig$ = this.api.call('zfs.tier.config').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }
    return this.tierConfig$;
  }

  subscribeTierJobUpdates(): Observable<ZfsTierRewriteJobEntry> {
    return this.api.subscribe('zfs.tier.rewrite_job_query').pipe(
      map((event) => event.fields),
    );
  }
}
