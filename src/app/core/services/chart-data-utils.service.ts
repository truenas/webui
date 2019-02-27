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

/*********************************************************************************************************************/
  // NUKE EVERYTHING BELOW THIS
/*********************************************************************************************************************/

  sort =  function (data:any[], compareFunction?:any){ // Just like JS sort but now we can run in a worker
    let result =  compareFunction ? data.sort(compareFunction) : data.sort();
    return result;
  }

  timeFromData = function (date:Date) {
    let hh = date.getHours().toString();
    let mm = date.getMinutes().toString();
    let ss = date.getSeconds().toString();

    if(hh.length < 2){
      hh = "0" + hh
    }
    if(mm.length < 2){
      mm = "0" + mm
    }
    if(ss.length < 2){
      ss = "0" + ss
    }
    return hh + ":" + mm + ":" + ss;
  }

  makeTimeAxis = function (start:number, step:number, data:any,  axis?: string) {
    if(!axis){ 
      axis = 'x';
    }

    let labels: any[] = [axis];
    data[0].data.forEach((item, index) =>{
      let date = new Date(start * 1000 + index * step * 1000);
      labels.push(date);
    });

    return labels;
  }

  scopeTest = function (arr:any[]) {
    let result = this.aggregateDataTotal(arr);
    return result;
  }

  dataSanityCheck = function (arr: any[][]) {
    //Make sure all the child arrays are the same length
    const total = arr[0].length;
    arr.forEach((item, index) => {
      if(item.length !== total){return false;}
    })

    return true;
  }

  aggregateDataTotal = function (data: number[][]) {
    // Aggregate and merge multiple arrays of numbers into a single array. 
    let dataSanity = this.dataSanityCheck(data);
    if(!dataSanity){
      console.warn("Arrays are not all the same length!")
      return -1;
    }

    let result = [];;
    for(let i = 0; i < data[0].length; i++){
      let total = 0;
      for(let index = 0; index < data.length; index++){
        total += data[index][i];
      }
      result.push(total);
    }
    return result;
  }

  aggregateDataAverage = function (data: number[][]) {
    // Aggregate and merge multiple arrays of numbers into a single array. 
    let result = [];
    for(let i = 0; i < data[0].length; i++){
      let total = 0;
      for(let index = 0; index < data.length; index++){
        total += data[index][i];
      }
      let average = total / data.length;
      result.push(average);
    }
    return result;
  }

  // EXPERIMENTAL...
  // Create an object that contains all our operations. These should be pure functions
  // We do this in an object literal so we can easily export as a string.
  // From there we can create a Blob, and then run the code inside a web worker
  // This way we can avoid importing .js files from the file system
  // TODO: add postMessage() and onmessage() event handlers to exportedOperations
  public exportedOperations:any = {
    /*sort: String(this.sort),
    timeFromData: String(this.timeFromData),
    makeTimeAxis: String(this.makeTimeAxis),
    dataSanityCheck: String(this.dataSanityCheck),
    aggregateDataTotal: String(this.aggregateDataTotal),
    aggregateDataAverage: String(this.aggregateDataAverage)*/
  } 

}
