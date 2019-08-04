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
export class ReportsService implements OnDestroy {

  public dataEvents: Subject<CoreEvent> = new Subject<CoreEvent>();
  private reportsUtils: Worker;

  constructor(private ws: WebSocketService, private core:CoreService) { 
    //@ts-ignore
    this.reportsUtils = new Worker('./reports-utils.worker',{ type: 'module' });

    core.register({observerClass: this, eventName:"ReportDataRequest"}).subscribe((evt:CoreEvent) => {
      ws.call('reporting.get_data', [[evt.data.params],evt.data.timeFrame]).subscribe((res) =>{
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
  
          this.reportsUtils.postMessage({name:'ProcessCommandsAsReportData', data: repl, sender: evt.sender.chartId});
  
        } else {
          //this.core.emit({name:"ReportData-" + evt.sender.chartId, data: res[0], sender:this});
          this.reportsUtils.postMessage({name:'ProcessCommandsAsReportData', data: commands, sender: evt.sender.chartId});
        }
      });
    });

    this.reportsUtils.onmessage = ({data}) => {
      //console.log(data);
      if(data.name == 'ReportData'){
        this.core.emit({name: "ReportData-" + data.sender, data: data.data, sender:this});
      }
    };

  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
    this.reportsUtils.terminate();
  }

  prepReport(evt:CoreEvent){
    this.reportsUtils.onmessage = ({data}) => {
      let evt = data;
      console.log(evt);
    }

    let pipeLine: Command[] = [
      {
        command: 'maxDecimals',
        input: 3.145679156,
        options: [3]
      }//,
    ]

    this.reportsUtils.postMessage({name:'ProcessCommands', data: pipeLine, sender: 'chartID'});
  }

}
