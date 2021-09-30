import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Thread } from 'app/core/classes/thread';
import { CoreEvent } from 'app/interfaces/events';
import { CoreService } from './core-service/core.service';

@UntilDestroy()
@Injectable()
export class ChartDataUtilsService {
  protected runAsWebWorker = false;
  protected worker: Worker;
  thread: Worker;
  protected ready: boolean;

  constructor(protected core: CoreService) {
    // Operations are what will run on the thread
    const operations = (): void => {
      const context: Worker = window.self as any; // Required so Typescript doesn't complain

      const callback = (data: any): void => {
        context.postMessage({ name: 'TEST FROM THREAD CALLBACK', data });
      };

      context.onmessage = (e: MessageEvent) => {
        const evt: CoreEvent = e.data;
        console.warn('Thread received message: ' + evt.name);
        console.warn(evt);
        callback(evt.data);
      };
    };

    // Create the new thread
    const thread = new Thread();

    // Give the thread instructions
    thread.operations = operations;

    // Calback for when we receive messages from the thread
    thread.onmessage = (e: MessageEvent) => {
      const evt: CoreEvent = e.data;
      this.core.emit(evt);
    };

    // Start up the thread
    thread.start();

    // Test Message
    thread.postMessage({ name: 'TEST FROM SERVICE', data: 'Test Data Placeholder' });

    core.register({ observerClass: this, eventName: 'ReportsHandleSources' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      thread.postMessage(evt);
    });

    core.register({ observerClass: this, eventName: 'ReportsHandleStats' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      thread.postMessage(evt);
    });
  }
}
