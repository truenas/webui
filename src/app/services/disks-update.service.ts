import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import {
  Observable, Subject,
} from 'rxjs';
import { ApiEvent } from 'app/interfaces/api-event.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DisksUpdateService {
  private subscription: Observable<ApiEvent<Disk>>;
  private subscribers: { [key: string]: Subject<ApiEvent<Disk>> } = { };

  constructor(
    private ws: WebSocketService,
  ) { }

  addSubscriber(newSubscriber$: Subject<ApiEvent<Disk>>): string {
    const uuid = UUID.UUID();
    this.subscribers[uuid] = newSubscriber$;
    if (!this.subscription) {
      this.subscription = this.ws.subscribe('disk.query');
      this.subscription.pipe(
        untilDestroyed(this),
      ).subscribe({
        next: (event) => {
          const subjects = Object.values(this.subscribers);
          for (const subscriber$ of subjects) {
            subscriber$.next(event);
          }
        },
      });
    }
    return uuid;
  }

  removeSubscriber(uuid: string): void {
    delete this.subscribers[uuid];
    if (Object.keys(this.subscribers).length === 0) {
      this.ws.unsubscribe(this.subscription);
      this.subscription = null;
    }
  }
}
