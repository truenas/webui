import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable ,  Observer ,  Subject } from 'rxjs';
import { CoreService, CoreEvent } from './core.service';
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

  protected runAsWebWorker:boolean = false;
  protected worker:Worker;

  constructor(protected core: CoreService){
    console.log("ChartDataUtils Constructor")

    //console.log(JSON.stringify(this.exportedOperations))
    //console.log(this.scopeTest);

    /*console.log(this.scopeTest([
     [3,1,5,2,3],
     [2,3,8],
     [2,8,2,5]
    ]
    ));*/


  }

  startWorker(){
    /*const file = new Blob([JSON.stringify(this.exportedOperations)]); // Convert code to string and create Blob (object that File inherits from)
    const fileUrl = window.URL.createObjectURL(file, {type: 'application/javascript; charset=utf-8'}); // Give it a URL and MIME type
    this.worker = new Worker(fileUrl);// Create the Worker and give it the Blob via the URL */
  }

  stopWorker(){
    this.worker.terminate();
  }

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
