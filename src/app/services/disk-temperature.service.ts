import { Injectable } from '@angular/core';
import {
  filter,
  map, Observable, repeat,
  switchMap,
  takeUntil,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DiskTemperatures } from 'app/interfaces/disk.interface';
import { WebSocketService } from 'app/services/ws.service';

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
  private disksChanged$ = this.websocket.subscribe('disk.query').pipe(
    filter((event) => [
      IncomingApiMessageType.Added,
      IncomingApiMessageType.Changed,
      IncomingApiMessageType.Removed,
    ].includes(event.msg)),
  );

  constructor(
    protected websocket: WebSocketService,
  ) { }

  getTemperature(): Observable<DiskTemperatures> {
    return this.websocket
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
          return this.websocket.call('disk.temperatures', [disks]).pipe(
            repeat({ delay: 10000 }),
            takeUntil(this.disksChanged$),
          );
        }),
      );
  }
}
