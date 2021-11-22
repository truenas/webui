import { Injectable } from '@angular/core';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';

@Injectable()
export class Thread extends IxAbstractObject {
  thread: Worker;
  protected ready: boolean;
  protected maxThreads: number;

  private _onmessage: (event: MessageEvent) => void;
  set onmessage(value: (event: MessageEvent) => void) {
    this._onmessage = value;
  }

  // Execution States (used by thread pool manager )
  protected executing = false;
  protected cancelled = false;
  protected finished = false;

  // The functions that can be executed by thread.
  // For more info: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers
  operations: () => void;

  constructor() {
    super();
    this.maxThreads = navigator.hardwareConcurrency;
  }

  testMessages(): void {
    this.thread.postMessage({ name: 'CoreEventTest2' });
  }

  readonly main = (): void => {
    // Some example code to show how messages can be exchanged with main thread
    const context = window.self as unknown as Worker; // Needed for TypeScript not to complain. DO NOT REMOVE!
    context.postMessage('ThreadInitialized'); // This inits the worker. DO NOT REMOVE!

    context.onerror = (err) => {
      console.error(err);
    };
  };

  createThread(): Worker {
    const url = 'assets/scripts/lib/data_utils.js';
    return new Worker(url);
  }

  start(): void {
    if (!this.operations) {
      console.error('Started with thread.operations not set! Make sure operations is not null before trying to start process.');
      return;
    }
    // Create the worker thread
    this.thread = this.createThread();

    this.thread.onmessage = this._onmessage; // <-- Why does this not work??
    /* this.thread.onmessage = (e:MessageEvent) => {
      this.messages.next(e.data);
    } */

    // Setup callbacks in the main thread.
    /* this.thread.onmessage = (e:MessageEvent) => {
      if(e.data == "ThreadInitialized"){
        this.ready = !this.ready;
        this.testMessages();
        return ;
      }
      console.log("Main thread received message: ");
      let evt:CoreEvent = e.data;
      console.log(evt);
      console.log("EventName = " + evt.name);
      console.log("EventData = " + evt.data);
    } */

    // Initialize the thread
    this.thread.postMessage({ name: 'StartThread', data: 'first message' });
    this.executing = true;
  }

  exit(): void {
    this.finished = true;
    this.thread.terminate();
  }

  cancel(): void {
    this.cancelled = true;
    this.thread.terminate();
  }

  postMessage(e: any): void {
    this.thread.postMessage(e);
  }

  // Just like JS sort but now we can run in a worker
  sort = <T>(data: T[], compareFunction?: (a: T, b: T) => number): T[] => {
    return compareFunction ? data.sort(compareFunction) : data.sort();
  };
}
