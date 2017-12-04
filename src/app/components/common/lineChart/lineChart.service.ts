import { Injectable } from '@angular/core';
import { WebSocketService } from '../../../services';
import { TranslateService } from '@ngx-translate/core';

/*
 * Fed to the LineChart ./lineChart.component.ts
 */
export interface LineChartData {
  labels: Date[];
  series: any[];
}


/**
 * For a given chart.. This is each line on the chart.
 * 
 * For Example
 * 
 *  {
        'source': 'aggregation-cpu-sum',
        'type': 'cpu-user',
        'dataset': 'value'
    }



 */
export interface DataListItem {
  source: string;
  type: string;
  dataset: string;
  jsonResponse?: any;
}


/**
 * One Whole Charts worth of data.
 * Well.. All that's needed to query that data.
 * series allows you to by-pass the whole query..
 * and just set the data directly.  This is being done in the
 * Main Dashboard regarding storage size.
 */
export interface ChartConfigData {
  keyValue: string,
  title: string;
  legends: string[];
  type: string;
  dataList: DataListItem[];
  series?: any[][];  
  divideBy?: number;
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
  public static lineChart = "Line";
  public static pieChart = "Pie";

  private cacheConfigData: ChartConfigData[] = [];

  constructor(private _ws: WebSocketService, public translate: TranslateService) {}

  public getData(dataHandlerInterface: HandleDataFunc, dataList: any[]) {

    this._ws.call('stats.get_data', [dataList, {step: '10', start: 'now-10m'}]).subscribe((res) => {
      const linechartData: LineChartData = {
        labels: new Array<Date>(),
        series: new Array<any>()
      }

      dataList.forEach(() => {linechartData.series.push([]);})
      res.data.forEach((item, i) => {
        linechartData.labels.push(new Date(res.meta.start * 1000 + i * res.meta.step * 1000));
        for (const x in dataList) {
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
      const knownCharts: ChartConfigData[] = this.getKnownChartConfigData();
      knownCharts.forEach((item) => {this.cacheConfigData.push(item);});

      handleChartConfigDataFunc.handleChartConfigDataFunc(this.cacheConfigData);
    });
  }

  private getCacheConfigDataByTitle(title: string): ChartConfigData {
    let chartConfigData: ChartConfigData = null;

    for (const cacheConfigDataItem of this.cacheConfigData) {
      if (title === cacheConfigDataItem.title) {
        chartConfigData = cacheConfigDataItem;
        break;
      }
    }

    return chartConfigData;
  }

  /**
   * For RRD metric files that don't have a dataset called value... 
   * This method findsd the ones I use.. Sparing me an expensive call
   * to get_source_info Api.
   */
  private computeValueColumnName(source: string, dataSetType: string): string {
    let returnVal = "value"; // default

    if (source.startsWith("disk-")) {

      if (dataSetType === "disk_octets" || dataSetType === "disk_ops" || dataSetType === "disk_time") {
        returnVal = "read";
      } else if (dataSetType === "disk_io_time") {
        returnVal = "io_time";
      }


    } else if (source.startsWith("interface-")) {
      returnVal = "rx";
    } else if (source === "ctl-tpc") {
      returnVal = "read";
    } else if (source === "zfs_arc") {
      if (dataSetType === "io_octets-L2") {
        returnVal = "rx";
      }
    }


    return returnVal;
  }

  /** 
   * Certain nodes like... disk_io have read/write.  WHen I get a source that's like that... Ill auto create
   * the Write.  Do this for all types I need.  rx/tx etc.... where a given source has datasets that make
   * sense displayed together.  Most nodes.. This does not happen.  That's why the name "Possible" is in the 
   * funciton.
   */
  private constructPossibleNodeCopy(dataListItem: DataListItem, dataListItemArray: DataListItem[]): void {
    if (dataListItem.dataset === "read") {
      const dataListItemCopied: DataListItem = {
        source: dataListItem.source,
        type: dataListItem.type,
        dataset: "write"
      };

      dataListItemArray.push(dataListItemCopied);
    } else if (dataListItem.dataset === "rx") {
      const dataListItemCopied: DataListItem = {
        source: dataListItem.source,
        type: dataListItem.type,
        dataset: "tx"
      };

      dataListItemArray.push(dataListItemCopied);
    }
  }

  /**
   * Take the WebSocket response for get_sources and chruns it 
   * down into a list of javascript objects that drive the charts.
   */
  private chartConfigDataFromWsReponse(res): ChartConfigData[] {
    const configData: ChartConfigData[] = [];
    let properties: string[] = [];
    for (const prop in res) {
      properties.push(prop);
    }

    properties = properties.sort();

    for (const prop of properties) {

      if (prop.startsWith("disk-")) {
        configData.push({
          keyValue: prop + " (disk_time)",
          title: prop + " (" + this.translate.instant("disk_time") + ")",
          type: LineChartService.lineChart,
          legends: [this.translate.instant("read"), this.translate.instant("write")],
          dataList: [{source: prop, type: 'disk_time', dataset: 'read'},
          {source: prop, type: 'disk_time', dataset: 'write'}]
        });

        configData.push({
          keyValue: prop + " (disk_io_time)",
          title: prop + " (" + this.translate.instant("disk_io_time") + ")",
          type: LineChartService.lineChart,
          legends: [this.translate.instant("read"), this.translate.instant("write")],
          dataList: [{source: prop, type: 'disk_io_time', dataset: 'io_time'}]
        });

        configData.push({
          keyValue: prop + " (disk_ops)",
          title: prop + " (" + this.translate.instant("disk_ops") + ")",
          type: LineChartService.lineChart,
          legends: [this.translate.instant("read"), this.translate.instant("write")],
          dataList: [{source: prop, type: 'disk_ops', dataset: 'read'},
          {source: prop, type: 'disk_ops', dataset: 'write'}]
        });

        configData.push({
          keyValue: prop + " (disk_octets)",
          title: prop + " (" + this.translate.instant("disk_octets") + ")",
          type: LineChartService.lineChart,
          legends: [this.translate.instant("read"), this.translate.instant("write")],
          dataList: [{source: prop, type: 'disk_octets', dataset: 'read'},
          {source: prop, type: 'disk_octets', dataset: 'write'}]
        });

      } else if (prop.startsWith("interface-")) {
        configData.push({
          keyValue: prop + " (if_errors)",
          title: prop + " (" + this.translate.instant("if_errors") + ")",
          type: LineChartService.lineChart,
          legends: [this.translate.instant("rx"), this.translate.instant("tx")],
          dataList: [{source: prop, type: 'if_errors', dataset: 'rx'},
          {source: prop, type: 'if_errors', dataset: 'tx'}]
        });

        configData.push({
          keyValue: prop + " (if_octets)",
          title: prop + " (" + this.translate.instant("if_octets") + ")",
          type: LineChartService.lineChart,
          legends: [this.translate.instant("rx"), this.translate.instant("tx")],
          dataList: [{source: prop, type: 'if_octets', dataset: 'rx'},
          {source: prop, type: 'if_octets', dataset: 'tx'}]
        });

        configData.push({
          keyValue: prop + " (if_packets)",
          title: prop + " (" + this.translate.instant("if_packets") + ")",
          type: LineChartService.lineChart,
          legends: [this.translate.instant("rx"), this.translate.instant("tx")],
          dataList: [{source: prop, type: 'if_packets', dataset: 'rx'},
          {source: prop, type: 'if_packets', dataset: 'tx'}]
        });

      } else {
        const propObjArray: string[] = [];
        const dataListItemArray: DataListItem[] = [];

        res[prop].forEach((proObjArrayItem) => {

          propObjArray.push(this.translate.instant(proObjArrayItem));

          const dataListItem: DataListItem = {
            source: prop,
            type: proObjArrayItem,
            dataset: this.computeValueColumnName(prop, proObjArrayItem)
          };

          dataListItemArray.push(dataListItem);
          this.constructPossibleNodeCopy(dataListItem, dataListItemArray);

        });

        let divideBy: number;
        let title: string = prop;
        
        // Things I want convertd from Bytes to gigabytes
        if (prop.startsWith("df-") ||
          prop === "memory" || prop === "swap") {
          divideBy = 1073741824;
          title += " (gigabytes)";
        }
        
        
        configData.push({
          keyValue: title,
          title: this.translate.instant(title),
          type: LineChartService.lineChart,
          legends: propObjArray,
          dataList: dataListItemArray,
          divideBy: divideBy
        });
      }

    }

    return configData;
  }

  /**
   * Certain ones I can hard code.. And interject them into the dynamic ones.
   */
  private getKnownChartConfigData(): ChartConfigData[] {


    const chartConfigData: ChartConfigData[] = [
      {
        keyValue: "CPU",
        title: this.translate.instant("CPU"),
        legends: [
          this.translate.instant('User'),
          this.translate.instant('Interrupt'),
          this.translate.instant('System'),
          this.translate.instant('Idle'),
          this.translate.instant('Nice')
        ],
        type: LineChartService.lineChart,
        dataList: [
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-user', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-interrupt', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-system', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-idle', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-nice', 'dataset': 'value'},
        ],
      }, {
        keyValue: "Load",
        title: this.translate.instant("Load"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Short Term'),
          this.translate.instant('Mid Term'),
          this.translate.instant('Long Term')
        ],
        dataList: [
          {'source': 'load', 'type': 'load', 'dataset': 'shortterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
        ],
      }, {
        keyValue: "ZFS Arc Size",
        title: this.translate.instant("ZFS Arc Size"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Arc Size')
        ],
        dataList: [
          {source: 'zfs_arc', type: 'cache_size-arc', dataset: 'value'}
        ],
      }, {
        keyValue: "ZFS Arc Hit Ratio",
        title: this.translate.instant("ZFS Arc Hit Ratio"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Arc'),
          this.translate.instant('L2')
        ],
        dataList: [
          {source: 'zfs_arc', type: 'cache_ratio-arc', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_ratio-L2', dataset: 'value'}
        ],
      }, {
        keyValue: "ZFS Demand Data",
        title: this.translate.instant("ZFS Demand Data"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Hits'),
          this.translate.instant('Miss')
        ],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-demand_data-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-demand_data-miss', dataset: 'value'}
        ],
      }, {
        keyValue: "ZFS Demand Metadata",
        title: this.translate.instant("ZFS Demand Metadata"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Hits'),
          this.translate.instant('Miss')
        ],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-demand_metadata-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-demand_metadata-miss', dataset: 'value'}
        ],
      }, {
        keyValue: "ZFS Prefetch Data",
        title: this.translate.instant("ZFS Prefetch Data"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Hits'),
          this.translate.instant('Miss')
        ],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-prefetch_data-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-prefetch_data-miss', dataset: 'value'}
        ],
      }, {
        keyValue: "ZFS Prefetch Metadata",
        title: this.translate.instant("ZFS Prefetch Metadata"),
        type: LineChartService.lineChart,
        legends: [
          this.translate.instant('Hits'),
          this.translate.instant('Miss')
        ],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-prefetch_metadata-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-prefetch_metadata-miss', dataset: 'value'}
        ],
      }
    ];

    return chartConfigData;

  }

}
