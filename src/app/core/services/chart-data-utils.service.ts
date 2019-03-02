import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Observer } from 'rxjs';
import { Subject } from 'rxjs';
import { CoreService, CoreEvent } from './core.service';
import { Thread } from 'app/core/classes/thread';
import * as moment from 'moment';

export interface ProcessTask {
  responseEvent: string;
  operation:string;
  data:any[];
}

interface TimeData { // This is in WidgetChartComponent as well. Widgets eventually need to be updated to use this instead
  start: number;
  end: number;
  step: number;
  legend?: string;
}

@Injectable()
export class ChartDataUtilsService {

  private debug: boolean = false;
  protected runAsWebWorker:boolean = false;
  protected worker:Worker;
  public thread:Worker;
  protected ready: boolean;

  constructor(protected core: CoreService){
    console.log("ChartDataUtils Constructor");

    // Operations are what will run on the thread
    const operations = (e) => {
      const context:Worker = self as any; // Required so Typescript doesn't complain
      //context.postMessage({name:"THREAD-INIT", data: [] }); // Initialize the thread
      console.log(context);
      
      var callback = (data) => {
        context.postMessage({name:"TEST FROM THREAD CALLBACK", data: data});
      }

      context.onmessage = (e:MessageEvent) => {
        let evt:CoreEvent = e.data;
        console.warn("Thread received message: " + evt.name);
        console.warn(evt);
        callback(evt.data);
      }
    }

    // Create the new thread
    const thread = new Thread(core);

    // Give the thread instructions
    thread.operations = operations;

    // Calback for when we receive messages from the thread
    thread.onmessage = (e:MessageEvent) => {
      let evt:CoreEvent = e.data;
      if(this.debug) {
        console.log("Parent received message:" + evt.name);
        console.log(evt);
      }
      //console.warn("chart-data-utils")
      this.core.emit(evt);
    }

    // Start up the thread
    thread.start();

    // Test Message
    thread.postMessage({name:"TEST FROM SERVICE", data:"Test Data Placeholder"});

    core.register({observerClass:this, eventName:"ReportsHandleSources"}).subscribe((evt:CoreEvent) => {
      thread.postMessage(evt);
    });

    core.register({observerClass:this, eventName:"ReportsHandleStats"}).subscribe((evt:CoreEvent) => {
      thread.postMessage(evt);
    });

  }

}
