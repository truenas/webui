import {Injectable} from '@angular/core';

import {WebSocketService} from '../../../services/';
import {BaThemeConfigProvider, colorHelper, layoutPaths} from '../../../theme';


/*
 * Fed to the LineChart ./lineChart.component.ts
 */
export interface LineChartData {
  labels: Date[];
  series: any[];
}


/**
 * For a given chart.. This is each line on the chart.
 */
export interface DataListItem {
  source: string;
  type: string;
  dataset: string;
  jsonResponse?: any;
}


/**
 * One Whole Charts worth of data
 */
export interface ChartConfigData {
  title: string;
  legends: string[];
  dataList: DataListItem[];
}


/**
 * Retunrs back the Series/Data Points for a given chart.
 */
export interface HandleDataFunc {
  handleDataFunc(lineChartData: LineChartData);

}

/**
 * Gets all the existing Collectd/Report RRD Sources with a high level list
 * Of children types: string[] Some charts/Metrics require more data..  And
 * Need to have additional ? optional parameters filled out... Via LineChartService.extendChartConfigData
 */
export interface HandleChartConfigDataFunc {
  handleChartConfigDataFunc(chartConfigData: ChartConfigData[]);
}


@Injectable()
export class LineChartService {

  private cacheConfigData: ChartConfigData[] = [];
  
  constructor(private _baConfig: BaThemeConfigProvider,
    private _ws: WebSocketService) {}

  public getData(dataHandlerInterface: HandleDataFunc, dataList: any[]) {

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


  public getChartConfigData(handleChartConfigDataFunc: HandleChartConfigDataFunc) {
    // Use this instead of the below.. TO just spoof the data
    // So you can see what the control looks like with no WS

    //this.getChartConfigDataSpoof(handleChartConfigDataFunc);

    this._ws.call('stats.get_sources').subscribe((res) => {
       this.cacheConfigData = this.chartConfigDataFromWsReponse(res);
        let knownCharts: ChartConfigData[] = this.getKnownChartConfigData();
        knownCharts.forEach((item)=>{this.cacheConfigData.push(item); });
      
        handleChartConfigDataFunc.handleChartConfigDataFunc(this.cacheConfigData);
    });
  }
  
  private getCacheConfigDataByTitle(title:string): ChartConfigData {
     let chartConfigData: ChartConfigData = null;
    
    for( let cacheConfigDataItem of this.cacheConfigData ) {
        if( title === cacheConfigDataItem.title ) {
            chartConfigData = cacheConfigDataItem;
            break;
        }
    }
    
    return chartConfigData;
  }

 private computeValueColumnName(source:string, dataSetType:string): string {
   let returnVal: string = "value"; // default
   
   if( source.startsWith("disk") ) {
     
     if( dataSetType === "disk_octets" || dataSetType === "disk_ops" || dataSetType === "disk_time") {
       returnVal = "read";
     } else  if( dataSetType === "disk_io_time") {
       returnVal = "io_time";
     }
     
      
   }
   
   
   return returnVal;
 }

  private chartConfigDataFromWsReponse(res): ChartConfigData[] {
    let configData: ChartConfigData[] = [];
    let properties: string[] = [];
    for (let prop in res) {
      properties.push(prop);
    }

    properties = properties.sort();

    for (let prop of properties) {
      var propObjArray: string[] = res[prop];
      var dataListItemArray: DataListItem[] = [];

      propObjArray.forEach((proObjArrayItem) => {

        let dataListItem: DataListItem = {
          source: prop,
          type: proObjArrayItem,
          dataset: this.computeValueColumnName(prop, proObjArrayItem)
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

    return configData;
  }


  private getKnownChartConfigData(): ChartConfigData[] {


    let chartConfigData: ChartConfigData[] = [
      {
        title: "CPU",
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
      }, {
        title: "Load",
        legends: ['Short Term', ' Mid Term', 'Long Term'],
        dataList: [
          {source: 'load', type: 'load', dataset: 'shortterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
        ],
      }
    ];

    return chartConfigData;

  }

}
