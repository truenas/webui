import { Injectable } from '@angular/core';
import {
  filter,
  map, Observable, repeat,
  switchMap,
  takeUntil,
} from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DiskTemperatures } from 'app/interfaces/disk.interface';
import { ApiService } from 'app/services/websocket/api.service';

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
  private disksChanged$ = this.api.subscribe('disk.query').pipe(
    filter((event) => [
      CollectionChangeType.Added,
      CollectionChangeType.Changed,
      CollectionChangeType.Removed,
    ].includes(event.msg)),
  );

  constructor(
    protected api: ApiService,
  ) { }

  getTemperature(): Observable<DiskTemperatures> {
    return this.api
      .call('webui.enclosure.dashboard')
      .pipe(
        repeat({ delay: () => this.disksChanged$ }),
        map((enclosures) => {
          return enclosures.map((enclosure) => {
            return Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot])
              .filter((element) => element.dev)
              .map((element) => element.dev);
          }).flat();
        }),
        switchMap((disks) => {
          return this.api.call('disk.temperatures', [disks]).pipe(
            repeat({ delay: 10000 }),
            takeUntil(this.disksChanged$),
          );
        }),
      );
  }
}
