import { Injectable, inject } from '@angular/core';
import {
  map, Observable, repeat, switchMap, takeUntil,
} from 'rxjs';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DiskTemperatures } from 'app/interfaces/disk.interface';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

export interface Temperature {
  keys: string[];
  values: DiskTemperatures;
  unit: string;
  symbolText: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiskTemperatureService {
  protected api = inject(TypedApiService);

  // The typed client only forwards added / changed / removed, so every event is a change.
  private disksChanged$ = this.api.subscribe('disk.query');

  getTemperature(): Observable<DiskTemperatures> {
    return this.api
      .call('webui.enclosure.dashboard')
      .pipe(
        repeat({ delay: () => this.disksChanged$ }),
        // Middleware types both responses as plain dicts.
        map((enclosures) => {
          return (enclosures as DashboardEnclosure[]).map((enclosure) => {
            return Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot])
              .map((element) => element.dev)
              .filter((dev) => !!dev) as string[];
          }).flat();
        }),
        switchMap((disks) => {
          return this.api.call('disk.temperatures', [disks]).pipe(
            map((temperatures) => temperatures as DiskTemperatures),
            repeat({ delay: 10000 }),
            takeUntil(this.disksChanged$),
          );
        }),
      );
  }
}
