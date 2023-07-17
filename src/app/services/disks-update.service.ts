import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { Subject, Subscription, switchMap } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DisksUpdateService {
  private subscription: Subscription;
  private subscribers: {
    [key: string]: { subscriber$: Subject<ApiEvent<Disk> | Disk[]>;
      getUpdatedDisks: boolean; };
  } = { };

  constructor(
    private ws: WebSocketService,
  ) { }

  addSubscriber(newSubscriber$: Subject<ApiEvent<Disk> | Disk[]>, getUpdatedDisks = false): string {
    // For subscribers with getUpdatedDisks = true returns already updated disks
    const uuid = UUID.UUID();
    this.subscribers[uuid] = { subscriber$: newSubscriber$, getUpdatedDisks };
    if (!this.subscription) {
      this.subscription = this.ws.subscribe('disk.query').pipe(
        tap((event) => {
          const subjects = Object.values(this.subscribers).filter((subject) => !subject.getUpdatedDisks);
          for (const subject of subjects) {
            subject.subscriber$.next(event);
          }
        }),
        debounceTime(50),
        switchMap(() => {
          return this.ws.call('disk.query');
        }),
        untilDestroyed(this),
      ).subscribe({
        next: (disks) => {
          const subjects = Object.values(this.subscribers).filter((subject) => subject.getUpdatedDisks);
          for (const subject of subjects) {
            subject.subscriber$.next(disks);
          }
        },
        error: (error) => {
          console.error(error);
        },
      });
    }
    return uuid;
  }

  removeSubscriber(uuid: string): void {
    delete this.subscribers[uuid];
    if (Object.keys(this.subscribers).length === 0 && this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}
