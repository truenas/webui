import {Injectable} from '@angular/core';

import {WebSocketService} from '../../../services/';
import {BaThemeConfigProvider, colorHelper, layoutPaths} from '../../../theme';



export interface LineChartData {
  labels: Date[];
  series: any[];
}


export interface DataListItem {
  source: string;
  type: string;
  dataset: string;
}

export interface ChartConfigData {
  title: string;
  legends: string[];
  dataList: DataListItem[];
}


export interface HandleDataFunc {
  handleDataFunc(lineChartData: LineChartData);

}

export interface HandleChartConfigDataFunc {
  handleChartConfigDataFunc(chartConfigData: ChartConfigData[]);
}


@Injectable()
export class LineChartService {

  constructor(private _baConfig: BaThemeConfigProvider,
    private _ws: WebSocketService) {}

  getData(dataHandlerInterface: HandleDataFunc, dataList: any[]) {

    this._ws.call('stats.get_data', [dataList, {}]).subscribe((res) => {
      let linechartData: LineChartData = {
        labels: new Array<Date>(),
        series: new Array<any>()
      }

      dataList.forEach(() => {linechartData.series.push([]);})
      res.data.forEach((item, i) => {
        linechartData.labels.push(
          new Date(res.meta.start * 1000 + i * res.meta.step * 1000));
        for (let x in dataList) {
          linechartData.series[x].push(item[x]);
        }
      });

      dataHandlerInterface.handleDataFunc(linechartData);
    });
  }


  getChartConfigDataSpoof(dataCallbackHandler: HandleChartConfigDataFunc) {
    let configData: ChartConfigData[] = [];

    let spoofData: ChartConfigData[] = [
      {
        title: "Average Load",
        legends: ['Short Term', ' Mid Term', 'Long Term'],
        dataList: [
          {source: 'load', type: 'load', dataset: 'shortterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
        ],
      },
      {
        title: "Memory",
        legends: ['Free', 'Active', 'Cache', 'Wired', 'Inactive'],
        dataList: [
          {'source': 'memory', 'type': 'memory-free', 'dataset': 'value'},
          {'source': 'memory', 'type': 'memory-active', 'dataset': 'value'},
          {'source': 'memory', 'type': 'memory-cache', 'dataset': 'value'},
          {'source': 'memory', 'type': 'memory-wired', 'dataset': 'value'},
          {'source': 'memory', 'type': 'memory-inactive', 'dataset': 'value'},
        ],
      },
      {
        title: "CPU Usage",
        legends: ['User', 'Interrupt', 'System', 'Idle', 'Nice'],
        dataList: [
          {
            'source': 'aggregation-cpu-sum',
            'type': 'cpu-user',
            'dataset': 'value'
          },
          {
            'source': 'aggregation-cpu-sum',
            'type': 'cpu-interrupt',
            'dataset': 'value'
          },
          {
            'source': 'aggregation-cpu-sum',
            'type': 'cpu-system',
            'dataset': 'value'
          },
          {
            'source': 'aggregation-cpu-sum',
            'type': 'cpu-idle',
            'dataset': 'value'
          },
          {
            'source': 'aggregation-cpu-sum',
            'type': 'cpu-nice',
            'dataset': 'value'
          },
        ],
      }
    ];

    setTimeout(() => {
      dataCallbackHandler.handleChartConfigDataFunc(spoofData);
    }, -1);

  }

  getChartConfigData(dataCallbackHandler: HandleChartConfigDataFunc) {


    this._ws.call('stats.get_sources').subscribe((res) => {
      let configData: ChartConfigData[] = [];

      for (let prop in res) {
        var propObjArray: string[] = res[prop];
        console.info("prop:" + prop, propObjArray);

        var dataListItemArray: DataListItem[] = [];

        propObjArray.forEach((proObjArrayItem) => {

          let dataListItem: DataListItem = {
            source: prop,
            type: proObjArrayItem,
            dataset: 'value'
          };

          dataListItemArray.push(dataListItem);
        });

        let chartData: ChartConfigData = {
          title: prop,
          legends: propObjArray,
          dataList: dataListItemArray
        };

        configData.push(chartData);

      }

      dataCallbackHandler.handleChartConfigDataFunc(configData);
    });
  }


}
