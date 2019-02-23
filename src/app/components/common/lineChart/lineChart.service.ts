import {Injectable} from '@angular/core';

import {WebSocketService} from '../../../services';



/*
 * For missing chart metadata like units
 * for axis labels etc
 * */
 export interface LineChartMetadata {
  source: string;
  units: string; // Units used as tick labels
  labelY:string;
//<<<<<<< HEAD
  dataUnits?:string;// What the middleware response provides
  conversion?:string;// What the chart should convert to.
//=======
  //unitsProvided?:string;
  removePrefix?: string;
//>>>>>>> master
 }

/*
 * Fed to the LineChart ./lineChart.component.ts
 */
export interface LineChartData {
  labels: Date[];
  series: any[];
  meta?: LineChartMetadata;
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
  title: string;
  legends: string[];
  type: string;
  dataList: DataListItem[];
  series?: any[][];  
  divideBy?: number;
  convertToCelsius?: boolean;
}


/**
 * Returns back the Series/Data Points for a given chart.
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

  constructor(private _ws: WebSocketService) {}

  public getData(dataHandlerInterface: HandleDataFunc, dataList: any[], rrdOptions?:any /*timeframe?:string*/) {
    /*console.log("Service is fetching data...");
    console.log(dataList);
    console.log("*****************************")*/
    //if(!timeframe){timeframe = 'now-10m';}
    if(!rrdOptions) {
      rrdOptions = {step: '10', start:'now-10m'};
      console.log("Default rrdOptions values applied")
    }
    let options:any  = {
      step: rrdOptions.step,
      start: rrdOptions.start.toString()
    }

    if(rrdOptions.end){
      options.end = rrdOptions.end.toString();
    }

    //this._ws.call('stats.get_data', [dataList, {step: '10', start:timeframe}]).subscribe((res) => {
    this._ws.call('stats.get_data', [dataList, options]).subscribe((res) => {
      //console.log(res);
      let meta = this.generateMetaData(res);
      const linechartData: LineChartData = {
        labels: new Array<Date>(),
        series: new Array<any>(),
        meta: meta
      }

      dataList.forEach(() => {linechartData.series.push([]);})
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

  generateMetaData(res){
    // This should ideally be done server side but putting it in so we can have proper labels 
    // in time for this 11.2 release

    const spl = res.meta.legend[0].split('/');
    const prefix = spl[0];
    const dataName = spl[1];

    let dictionary: LineChartMetadata[] = [
      {source :'aggregation-cpu-sum', units:'%', labelY:'% CPU'},
      {source :'temperature', units:'°C', labelY:'Celsius', conversion:'decikelvinsToCelsius'},
      {source :'memory', units:'GiB', labelY:'Gigabytes', removePrefix:'memory-'},
      {source :'swap', units:'GiB', labelY:'Gigabytes', removePrefix:'swap-'},
      {source :'if_errors', units:'', labelY:'Bits/s'},
      {source :'if_octets', units:'', labelY:'Bits/s'},
      {source :'if_packets', units:'', labelY:'Bits/s'},
      {source :'df-mnt-', units:'GiB', labelY: 'Gigabytes', removePrefix:'df_complex-'},
      {source :'ctl-tpc', units:'GiB', labelY: 'Bytes/s', removePrefix:'disk_'},
      {source :'ctl-iscsi', units:'GiB', labelY: 'Bytes/s', removePrefix:'disk_'},
      {source :'disk_time', units:'k', labelY: 'Bytes/s'},
      {source :'disk_octets', units:'k', labelY: 'Bytes/s'},
      {source :'disk_io_time', units:'k', labelY: 'Bytes/s'},
      {source :'disk_ops', units:'', labelY: 'Operations/s'},
      {source :'disktemp-', units:'°', labelY: 'Celsius'},
      {source :'cache_size-arc', units:'GiB', labelY: 'Gigabytes', dataUnits: 'bytes', conversion:'bytesToGigabytes'},
      {source :'cache_ratio-arc', units:'%', labelY: 'Hits', dataUnits:'percentage', conversion:'percentFloatToInteger'},
      {source :'processes', units:'', labelY: 'Processes', removePrefix:'ps_state-'},
      {source :'cache_result-demand_data-hit', units:'', labelY: 'Requests'},
      {source :'cache_result-demand_metadata-hit', units:'k', labelY: 'Requests'},
      {source :'cache_result-prefetch_data-hit', units:'', labelY: 'Requests'},
      {source :'cache_result-prefetch_metadata-hit', units:'m', labelY: 'Requests'},
      {source :'load', units:'m', labelY:'CPU Time'}// Keep this last to avoid false positives like 'download'
    ]

    const result = dictionary.find(item => prefix.includes(item.source) || item.source == dataName); 
    return result;
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
    //} else if (source === "ctl-tpc") {
    } else if (source.startsWith("ctl-") && source !== "ctl-ioctl") {
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

     if (prop.startsWith("cputemp-")) {
        configData.push({
          title: prop,
          type: LineChartService.lineChart,
          legends: ["temp"],
          dataList: [{source: prop, type: 'temperature', dataset: 'value'}]
        });

     } else if (prop.startsWith("disktemp-")) {
        configData.push({
          title: prop,
          type: LineChartService.lineChart,
          legends: ["temp"],
          dataList: [{source: prop, type: 'temperature', dataset: 'value'}]
        });

     } else if (prop.startsWith("disk-")) {
        configData.push({
          title: prop + " (disk_time)",
          type: LineChartService.lineChart,
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_time', dataset: 'read'},
          {source: prop, type: 'disk_time', dataset: 'write'}]
        });

        configData.push({
          title: prop + " (disk_io_time)",
          type: LineChartService.lineChart,
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_io_time', dataset: 'io_time'}]
        });

        configData.push({
          title: prop + " (disk_ops)",
          type: LineChartService.lineChart,
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_ops', dataset: 'read'},
          {source: prop, type: 'disk_ops', dataset: 'write'}]
        });

        configData.push({
          title: prop + " (disk_octets)",
          type: LineChartService.lineChart,
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_octets', dataset: 'read'},
          {source: prop, type: 'disk_octets', dataset: 'write'}]
        });

      } else if (prop.startsWith("interface-")) {
        configData.push({
          title: prop + " (if_errors)",
          type: LineChartService.lineChart,
          legends: ["rx", "tx"],
          dataList: [{source: prop, type: 'if_errors', dataset: 'rx'},
          {source: prop, type: 'if_errors', dataset: 'tx'}]
        });

        configData.push({
          title: prop + " (if_octets)",
          type: LineChartService.lineChart,
          legends: ["rx", "tx"],
          dataList: [{source: prop, type: 'if_octets', dataset: 'rx'},
          {source: prop, type: 'if_octets', dataset: 'tx'}]
        });

        configData.push({
          title: prop + " (if_packets)",
          type: LineChartService.lineChart,
          legends: ["rx", "tx"],
          dataList: [{source: prop, type: 'if_packets', dataset: 'rx'},
          {source: prop, type: 'if_packets', dataset: 'tx'}]
        });

      } else {
        const propObjArray: string[] = res[prop];
        const dataListItemArray: DataListItem[] = [];

        propObjArray.forEach((proObjArrayItem) => {



          const dataListItem: DataListItem = {
            source: prop,
            type: proObjArrayItem,
            dataset: this.computeValueColumnName(prop, proObjArrayItem)
          };

          dataListItemArray.push(dataListItem);
          this.constructPossibleNodeCopy(dataListItem, dataListItemArray);

        });

        let divideBy: number;
        let convertToCelsius: boolean;
        //let title: string = prop == "ctl-tpc" ? "SCSI Target Port (tpc)" : prop; 

        // Put in ugly override. Wasn't really a better place for this one change.
        let title;
        if(prop == "ctl-iscsi" || prop == "ctl-tpc"){
          title = "SCSI Target Port (" + prop.replace("ctl-", "") + ")";
        } else {
          title = prop;
        }
        
        // Things I want convertd from Bytes to gigabytes
        if (prop.startsWith("df-") ||
          prop === "memory" || prop === "swap") {
          divideBy = 1073741824;
          title += " (gigabytes)";
        }
        
        // Things I want convertd from decikelvins to celsius
        if (prop.startsWith("cputemp-")) {
          convertToCelsius = true;
          title += " (celsius)";
        }
        
        
        configData.push({
          title: title,
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
        title: "CPU",
        legends: ['User', 'Interrupt', 'System', 'Idle', 'Nice'],
        type: LineChartService.lineChart,
        dataList: [
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-user', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-interrupt', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-system', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-idle', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-nice', 'dataset': 'value'},
        ],
      }, {
        title: "Load",
        type: LineChartService.lineChart,
        legends: ['Short Term', ' Mid Term', 'Long Term'],
        dataList: [
          {'source': 'load', 'type': 'load', 'dataset': 'shortterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
        ],
      }, {
        title: "ZFS Arc Size",
        type: LineChartService.lineChart,
        legends: ['Arc Size', 'L2Arc'],
        dataList: [
          {source: 'zfs_arc', type: 'cache_size-arc', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_size-L2', dataset: 'value'}
        ],
      }, {
        title: "ZFS Arc Hit Ratio",
        type: LineChartService.lineChart,
        legends: ['Arc', 'L2'],
        dataList: [
          {source: 'zfs_arc', type: 'cache_ratio-arc', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_ratio-L2', dataset: 'value'}
        ],
      }, {
        title: "ZFS Demand Data",
        type: LineChartService.lineChart,
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-demand_data-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-demand_data-miss', dataset: 'value'}
        ],
      }, {
        title: "ZFS Demand Metadata",
        type: LineChartService.lineChart,
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-demand_metadata-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-demand_metadata-miss', dataset: 'value'}
        ],
      }, {
        title: "ZFS Prefetch Data",
        type: LineChartService.lineChart,
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-prefetch_data-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-prefetch_data-miss', dataset: 'value'}
        ],
      }, {
        title: "ZFS Prefetch Metadata",
        type: LineChartService.lineChart,
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-prefetch_metadata-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-prefetch_metadata-miss', dataset: 'value'}
        ],
      }
    ];


    return chartConfigData;

  }

}
