import {Injectable} from '@angular/core';

import {WebSocketService} from '../../../services/';

export interface LineChartData {
    labels: Date[];
    series: any[];
}


export interface HandleDataFunc {
  handleDataFunc( lineChartData: LineChartData);
  
}


@Injectable()
export class LineChartService {

  constructor(
              private _ws: WebSocketService) {}

  getData(dataHandlerInterface: HandleDataFunc, dataList: any[]) {

    this._ws.call('stats.get_data', [ dataList, {} ]).subscribe((res) => {
      const linechartData: LineChartData = {
        labels: new Array<Date>(),
        series: new Array<any>()
      }
      
      dataList.forEach(() => { linechartData.series.push([]); })
      res.data.forEach((item, i) => {
        linechartData.labels.push(
            new Date(res.meta.start * 1000 + i * res.meta.step * 1000));
        for (const x in dataList) {
          linechartData.series[x].push(item[x]);
        }
      });
      
      dataHandlerInterface.handleDataFunc(linechartData);
    });
  }
}
