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
        console.log(res);
        if(evt.data.report.name == "cputemp"){
          let command = [
            {
              command: 'avgCpuTempReport',
              input: res[0]
            }
          ]
  
          //this.reportsUtils.postMessage({name:'ProcessCommands', data: command, sender: evt.sender.chartId});
          this.reportsUtils.postMessage({name:'ProcessCommandsAsReportData', data: command, sender: evt.sender.chartId});
  
        } else {
          //this.data = res[0];
          this.core.emit({name:"ReportData-" + evt.sender.chartId, data: res[0], sender:this});
        }
      });
    });

    this.reportsUtils.onmessage = ({data}) => {
      //console.log(data);
      this.core.emit({name: "ReportData-" + data.sender, data: data.data, sender:this});
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
