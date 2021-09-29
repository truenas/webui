import { Injectable } from '@angular/core';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';

export interface ProcessTask {
  responseEvent: string;
  operation: any; // The main function
  data: any[]; // Arguments for the function.
}

@Injectable()
export class Thread extends IxAbstractObject {
  thread: Worker;
  protected ready: boolean;
  protected maxThreads: number;
  threadPriority = 0.0; // between 0.0 and 1.0 (1.0 being highest);

  private _onmessage: (event: MessageEvent) => void;
  set onmessage(value: (event: MessageEvent) => void) {
    this._onmessage = value;
  }

  // Execution States (used by thread pool manager )
  protected executing = false;
  protected cancelled = false;
  protected finished = false;

  // public messages: Subject<CoreEvent>

  // The functions that can be executed by thread.
  // For more info: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers
  operations: () => void;

  constructor() {
    super();
    this.maxThreads = navigator.hardwareConcurrency;

    /* this.messages = new Subject();
    this.messages.subscribe((evt:CoreEvent) => {
      if(evt.sender == this){ return;  }
      this.thread.postMessage(evt);
    }); */
  }

  testMessages(): void {
    // this.thread.postMessage(JSON.stringify({name:"CoreEventTest1"}));
    this.thread.postMessage({ name: 'CoreEventTest2' });
    // this.thread.postMessage("EventTest");
  }

  readonly main = (): void => {
    // Some example code to show how messages can be exchanged with main thread
    const context: Worker = window.self as any; // Needed for TypeScript not to complain. DO NOT REMOVE!
    context.postMessage('ThreadInitialized'); // This inits the worker. DO NOT REMOVE!

    /* context.onmessage = (msg: MessageEvent) => {
      let evt:CoreEvent = msg.data;
      let response = "SUCCESS!";
      context.postMessage({name:response, data: "e"});
    }; */

    context.onerror = (err) => {
      console.error(err);
    };
  };

  createThread(): Worker {
    // let blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });
    // let blob = new Blob([fn.toString()], { type: 'text/javascript' });
    // let url = URL.createObjectURL(blob);
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
