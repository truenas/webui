import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ZfsTierConfig } from 'app/interfaces/zfs-tier.interface';
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
}
