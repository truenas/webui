import { Injectable, OnDestroy } from '@angular/core';
import { WebSocketService } from 'app/services/ws.service';
import { Subject } from 'rxjs';
import { CoreEvent, CoreService } from 'app/core/services/core.service';

/*
 * This service acts as a proxy between middleware/web worker
 * and reports page components.
 * */

export interface Command {
  command: string; // Use '|' or '--pipe' to use the output of previous command as input
  input: any;
  options?: any[]; // Function parameters
} 

@Injectable({
  providedIn: 'root'
})
export class EntityTableService implements OnDestroy {

  public dataEvents: Subject<CoreEvent> = new Subject<CoreEvent>();
  private tableUtils: Worker;

  constructor(private ws: WebSocketService, private core:CoreService) { 
    //@ts-ignore
    this.tableUtils = new Worker('./table-utils.worker',{ type: 'module' });

    core.register({observerClass: this, eventName:"ReportDataRequest"}).subscribe((evt:CoreEvent) => {
      ws.call('reporting.get_data', [[evt.data.params],evt.data.timeFrame]).subscribe((raw_res) =>{
        let res;

        // If requested, we truncate trailing null values 
        if(evt.data.truncate){
          let truncated = this.truncateData(raw_res[0].data);
          res = Object.assign([], raw_res);
          res[0].data = truncated;
        } else {
          res = raw_res;
        }

        let commands = [
          {
            command: 'optimizeLegend',
            input: res[0]
          },
          {
            command: 'convertAggregations',
            input: '|',
            options: [evt.data.report.vertical_label] // units
          }
        ]

        // We average out cputemps for v11.3. 
        // Move this to backend for 12.
        if(evt.data.report.name == "cputemp"){
          // Do a complete replacement instead...
          const repl = [{
            command: 'avgCpuTempReport',
            input: res[0]
          }]
  
          this.tableUtils.postMessage({name:'ProcessCommandsAsReportData', data: repl, sender: evt.sender.chartId});
  
        } else {
          //this.core.emit({name:"ReportData-" + evt.sender.chartId, data: res[0], sender:this});
          this.tableUtils.postMessage({name:'ProcessCommandsAsReportData', data: commands, sender: evt.sender.chartId});
        }
      });
    });

    this.tableUtils.onmessage = ({data}) => {
      if(data.name == 'ReportData'){
        this.core.emit({name: "ReportData-" + data.sender, data: data.data, sender:this});
      }
    };

  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
    this.tableUtils.terminate();
  }

  prepReport(evt:CoreEvent){
    this.tableUtils.onmessage = ({data}) => {
      let evt = data;
    }

    let pipeLine: Command[] = [
      {
        command: 'maxDecimals',
        input: 3.145679156,
        options: [3]
      }
    ]

    this.tableUtils.postMessage({name:'ProcessCommands', data: pipeLine, sender: 'chartID'});
  }

  truncateData(data){
    let finished = false;
    let index = data.length - 1;
    do{
    
      //True only when all the values are null
      const isEmpty = !data[index].reduce((acc, v) => {
        // Treat zero as a value
        const value = v !== null ? 1 : v;
        return acc + value;
      });
    
      if(isEmpty){ 
        data.splice(index, 1);
      } else {
        finished = true;
      }
      index--
    } while(!finished && data.length > 0);
    
    return data;
  }

}
