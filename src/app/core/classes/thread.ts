import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Observer } from 'rxjs';
import { Subject } from 'rxjs';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';
import * as moment from 'moment';

export interface ProcessTask {
  responseEvent: string;
  operation:any; // The main function
  data:any[]; // Arguments for the function.
}

@Injectable()
export class Thread extends iXAbstractObject {

  private debug: boolean = true
  public thread:Worker;
  protected ready: boolean;
  protected maxThreads: number;
  public threadPriority: number = 0.0; // between 0.0 and 1.0 (1.0 being highest);

  private _onmessage: any;
  set onmessage(value:any){
    this._onmessage = value;
  }

  // Execution States (used by thread pool manager )
  protected executing: boolean = false;
  protected cancelled: boolean = false;
  protected finished: boolean = false;

  //public messages: Subject<CoreEvent>


  // The functions that can be executed by thread.
  // For more info: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers
  public operations: any; 

  constructor(core: CoreService){
    super()
    this.maxThreads = navigator.hardwareConcurrency;

    /*this.messages = new Subject();
    this.messages.subscribe((evt:CoreEvent) => {
      if(evt.sender == this){ return;  }
      this.thread.postMessage(evt);
    });*/

    if(this.debug){
      console.log("Thread Constructor");
      console.log("Client machine has " + (this.maxThreads / 2) + " cores (" + this.maxThreads + " threads)");
    }

  }

  testMessages(){
    //this.thread.postMessage(JSON.stringify({name:"CoreEventTest1"}));
    this.thread.postMessage({name:"CoreEventTest2"});
    //this.thread.postMessage("EventTest");
  }

  readonly main = (e) => {
    // Some example code to show how messages can be exchanged with main thread
    const context: Worker = self as any; // Needed for TypeScript not to complain. DO NOT REMOVE!
    context.postMessage("ThreadInitialized"); // This inits the worker. DO NOT REMOVE!
    console.log(context)
    
    /*context.onmessage = (msg: MessageEvent) => {
      let evt:CoreEvent = msg.data;
      let response = "SUCCESS!";
      context.postMessage({name:response, data: "e"});
    };*/

    context.onerror = (err) => {
      console.log(err);
    }

  }

  createThread(fn) {
    let blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });
    let url = URL.createObjectURL(blob);

    return new Worker(url);
  }

  start(){
    if(!this.operations){
      console.error("Started with thread.operations not set! Make sure operations is not null before trying to start process.")
      return;
    }
    // Create the worker thread
    this.thread = this.createThread(this.operations);

    this.thread.onmessage = this._onmessage; // <-- Why does this not work??
    /*this.thread.onmessage = (e:MessageEvent) => {
      this.messages.next(e.data);
    }*/

    // Setup callbacks in the main thread.
    /*this.thread.onmessage = (e:MessageEvent) => {
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
    }*/

    // Initialize the thread
    this.thread.postMessage({name: "StartThread", data: "first message"});
    this.executing = true;
  
  }

  exit(){
    this.finished = true;
    this.thread.terminate();
  }

  cancel(){
    this.cancelled = true;
    this.thread.terminate();
  }

  postMessage(e:any){
      this.thread.postMessage(e);
  }

  /*onmessage(fn){
    this._onmessage = fn;
  }*/

  sort =  function (data:any[], compareFunction?:any){ // Just like JS sort but now we can run in a worker
    let result =  compareFunction ? data.sort(compareFunction) : data.sort();
    return result;
  }

}
