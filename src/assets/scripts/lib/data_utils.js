var debug = false;


// ***************************************************** FROM SERVICE FILE (START) ***************************************************

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



/**
 * Returns back the Series/Data Points for a given chart.
 */

/**
 * Gets all the existing Collectd/Report RRD Sources with a high level list
 * Of children types: string[] Some charts/Metrics require more data..  And
 * Need to have additional ? optional parameters filled out... Via LineChartService.extendChartConfigData
 */


  /*getData(dataHandlerInterface: HandleDataFunc, dataList: any[], rrdOptions?:any ) {
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

    this._ws.call('stats.get_data', [dataList, options]).subscribe((res) => {
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
  }*/

  /*const getChartConfigData = (handleChartConfigDataFunc: HandleChartConfigDataFunc) => {
    // Use this instead of the below.. TO just spoof the data
    // So you can see what the control looks like with no WS


    this._ws.call('stats.get_sources').subscribe((res) => {
      this.cacheConfigData = this.chartConfigDataFromWsReponse(res);
      const knownCharts: ChartConfigData[] = this.getKnownChartConfigData();
      knownCharts.forEach((item) => {this.cacheConfigData.push(item);});

      handleChartConfigDataFunc.handleChartConfigDataFunc(this.cacheConfigData);
    });
  }*/


  const lineChart = "Line";
  const pieChart = "Pie";

  let cacheConfigData = [];

/**
   * The service returns back all sources as a flat list.  What I do in here is
   * Go through the flat list.. And collect the ones I want for each Tab I want to show.
   */

 /* handleChartConfigDataFunc(chartConfigData) {
     
    const map = new Map();

    // For every one of these map entries.. You see one tab in the UI With the charts collected for that tab
    map.set("CPU", {
      keyName: T("CPU"),
      path:"cpu",
      chartConfigData: [],
      paginatedChartConfigData: []

    });

    map.set("Disk", {
      keyName: T("Disk"),
      path:"disk",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Memory", {
      keyName: T("Memory"),
      path:"memory",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Network", {
      keyName: T("Network"),
      path:"network",
      chartConfigData: [],
      paginatedChartConfigData: []
    });


    map.set("Partition", {
      keyName: T("Partition"),
      path:"partition",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("System", {
      keyName: T("System"),
      path:"system",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("Target", {
      keyName: T("Target"),
      path:"target",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    map.set("ZFS", {
      keyName: T("ZFS"),
      path:"zfs",
      chartConfigData: [],
      paginatedChartConfigData: []
    });

    // Go through all the items.. Sticking each source in the appropraite bucket
    // The non known buckets.. Just get one tab/one chart. (for now).. Will eventually 
    // move towards.. just knowing the ones I want.
    chartConfigData.forEach((chartConfigDataItem) => {
      if (chartConfigDataItem.title === "CPU" || chartConfigDataItem.title === "Load") {
        const tab: TabChartsMappingData = map.get("CPU");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.toLowerCase().startsWith("memory") || chartConfigDataItem.title.toLowerCase().startsWith("swap")) {
        const tab: TabChartsMappingData = map.get("Memory");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.toLowerCase() === "processes" ) {
        const tab: TabChartsMappingData = map.get("System");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("df-")) {
        const tab: TabChartsMappingData = map.get("Partition");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("disk")) {
        const tab: TabChartsMappingData = map.get("Disk");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("interface-")) {
        const tab: TabChartsMappingData = map.get("Network");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("SCSI ")) {
        const tab: TabChartsMappingData = map.get("Target");
        tab.chartConfigData.push(chartConfigDataItem);

      } else if (chartConfigDataItem.title.startsWith("ZFS ")) {
        const tab: TabChartsMappingData = map.get("ZFS");
        tab.chartConfigData.push(chartConfigDataItem);

      } 
    });

    this.tabChartsMappingDataArray.splice(0, this.tabChartsMappingDataArray.length);
    map.forEach((value: TabChartsMappingData) => {

      if (this.tabChartsMappingDataSelected === undefined) {
        this.tabChartsMappingDataSelected = value;
        this.setPaginationInfo( this.tabChartsMappingDataSelected );
      }
      this.tabChartsMappingDataArray.push(value);
    });
  
    //this.drawTabs = true;
    //this.showSpinner = false;
    //this.activateTabFromUrl();
  }// End handleChartConfigDataFunc Method
*/

  const generateMetaData = (res) => {
    // This should ideally be done server side but putting it in so we can have proper labels 
    // in time for 11.2 release

    const spl = res.meta.legend[0].split('/');
    const prefix = spl[0];
    const dataName = spl[1];

    let dictionary = [
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
      {source :'load', units:'m', labelY:'CPU Time'}// Keep last to avoid false positives like 'download'
    ]

    const result = dictionary.find(item => prefix.includes(item.source) || item.source == dataName); 
    return result;
  }


  const getCacheConfigDataByTitle = (title) => {
    let chartConfigData = null;

    for (const cacheConfigDataItem of cacheConfigData) {
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
  const computeValueColumnName = (source, dataSetType) => {
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
   * the Write.  Do for all types I need.  rx/tx etc.... where a given source has datasets that make
   * sense displayed together.  Most nodes.. This does not happen.  That's why the name "Possible" is in the 
   * funciton.
   */
  const constructPossibleNodeCopy = (dataListItem, dataListItemArray) => {
    if (dataListItem.dataset === "read") {
      const dataListItemCopied = {
        source: dataListItem.source,
        type: dataListItem.type,
        dataset: "write"
      };

      dataListItemArray.push(dataListItemCopied);
    } else if (dataListItem.dataset === "rx") {
      const dataListItemCopied = {
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
  const chartConfigDataFromWsReponse = (res) => {
    const configData = [];
    let properties = [];
    for (const prop in res) {
      properties.push(prop);
    }

    properties = properties.sort();

    for (const prop of properties) {

     if (prop.startsWith("cputemp-")) {
        configData.push({
          title: prop,
          type: "line",
          legends: ["temp"],
          dataList: [{source: prop, type: 'temperature', dataset: 'value'}]
        });

     } else if (prop.startsWith("disktemp-")) {
        configData.push({
          title: prop,
          type: "line",
          legends: ["temp"],
          dataList: [{source: prop, type: 'temperature', dataset: 'value'}]
        });

     } else if (prop.startsWith("disk-")) {
        configData.push({
          title: prop + " (disk_time)",
          type: "line",
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_time', dataset: 'read'},
          {source: prop, type: 'disk_time', dataset: 'write'}]
        });

        configData.push({
          title: prop + " (disk_io_time)",
          type: "line",
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_io_time', dataset: 'io_time'}]
        });

        configData.push({
          title: prop + " (disk_ops)",
          type: "line",
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_ops', dataset: 'read'},
          {source: prop, type: 'disk_ops', dataset: 'write'}]
        });

        configData.push({
          title: prop + " (disk_octets)",
          type: "line",
          legends: ["read", "write"],
          dataList: [{source: prop, type: 'disk_octets', dataset: 'read'},
          {source: prop, type: 'disk_octets', dataset: 'write'}]
        });

      } else if (prop.startsWith("interface-")) {
        configData.push({
          title: prop + " (if_errors)",
          type: "line",
          legends: ["rx", "tx"],
          dataList: [{source: prop, type: 'if_errors', dataset: 'rx'},
          {source: prop, type: 'if_errors', dataset: 'tx'}]
        });

        configData.push({
          title: prop + " (if_octets)",
          type: "line",
          legends: ["rx", "tx"],
          dataList: [{source: prop, type: 'if_octets', dataset: 'rx'},
          {source: prop, type: 'if_octets', dataset: 'tx'}]
        });

        configData.push({
          title: prop + " (if_packets)",
          type: "line",
          legends: ["rx", "tx"],
          dataList: [{source: prop, type: 'if_packets', dataset: 'rx'},
          {source: prop, type: 'if_packets', dataset: 'tx'}]
        });

      } else {
        const propObjArray = res[prop];
        const dataListItemArray = [];

        propObjArray.forEach((proObjArrayItem) => {



          const dataListItem = {
            source: prop,
            type: proObjArrayItem,
            dataset: computeValueColumnName(prop, proObjArrayItem)
          };

          dataListItemArray.push(dataListItem);
          constructPossibleNodeCopy(dataListItem, dataListItemArray);

        });

        let divideBy;
        let convertToCelsius;
        //let title: string = prop == "ctl-tpc" ? "SCSI Target Port (tpc)" : prop; 

        // Put in ugly override. Wasn't really a better place for one change.
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
          type: "line",
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
  const getKnownChartConfigData = () => {


    const chartConfigData = [
      {
        title: "CPU",
        legends: ['User', 'Interrupt', 'System', 'Idle', 'Nice'],
        type: "line",
        dataList: [
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-user', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-interrupt', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-system', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-idle', 'dataset': 'value'},
          {'source': 'aggregation-cpu-sum', 'type': 'cpu-nice', 'dataset': 'value'},
        ],
      }, {
        title: "Load",
        type: "line",
        legends: ['Short Term', ' Mid Term', 'Long Term'],
        dataList: [
          {'source': 'load', 'type': 'load', 'dataset': 'shortterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
          {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
        ],
      }, {
        title: "ZFS Arc Size",
        type: "line",
        legends: ['Arc Size','L2Arc'],
        dataList: [
          {source: 'zfs_arc', type: 'cache_size-arc', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_size-L2', dataset: 'value'}
        ],
      }, {
        title: "ZFS Arc Hit Ratio",
        type: "line",
        legends: ['Arc', 'L2'],
        dataList: [
          {source: 'zfs_arc', type: 'cache_ratio-arc', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_ratio-L2', dataset: 'value'}
        ],
      }, {
        title: "ZFS Demand Data",
        type: "line",
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-demand_data-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-demand_data-miss', dataset: 'value'}
        ],
      }, {
        title: "ZFS Demand Metadata",
        type: "line",
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-demand_metadata-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-demand_metadata-miss', dataset: 'value'}
        ],
      }, {
        title: "ZFS Prefetch Data",
        type: "line",
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-prefetch_data-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-prefetch_data-miss', dataset: 'value'}
        ],
      }, {
        title: "ZFS Prefetch Metadata",
        type: "line",
        legends: ['Hits', 'Miss',],
        dataList: [
          {source: 'zfs_arc', type: 'cache_result-prefetch_metadata-hit', dataset: 'value'},
          {source: 'zfs_arc', type: 'cache_result-prefetch_metadata-miss', dataset: 'value'}
        ],
      }
    ];


    return chartConfigData;

  }


  const sourcesHandler = (res) => {
      cacheConfigData = chartConfigDataFromWsReponse(res);
      const knownCharts = getKnownChartConfigData();
      knownCharts.forEach((item) => {cacheConfigData.push(item);});

      //handleChartConfigDataFunc.handleChartConfigDataFunc(cacheConfigData);
      self.postMessage({name:"CacheConfigData", data : cacheConfigData});
  }

  const statsHandler = (data) => {
    // dataHandlerInterface, dataList, rrdOptions?

    let res = data.res;
    let dataList = data.dataList;

    
      let meta = generateMetaData(res);
      let linechartData = {
        labels: [], //new Array(),
        series: [], //new Array(),
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
      //dataHandlerInterface.handleDataFunc(linechartData);
      //console.log(linechartData);
      //console.warn(data);
      self.postMessage({name:"LineChartData:" + data.title, data : linechartData});
  }
  

// ***************************************************** FROM SERVICE FILE (END) ***************************************************


// Web Worker Library
var trace = (data) => {
  self.postMessage({name:"TEST FROM THREAD CALLBACK", data: data});
}

self.onmessage = (e) => {
  let evt= e.data;
  if(debug){
    console.warn("Thread received message: " + evt.name);
    console.warn(evt);
    trace(evt);
  }

  switch(evt.name){
    case "ReportsHandleSources":
      sourcesHandler(evt.data);
      break;
    case "ReportsHandleStats":
      statsHandler(evt.data);
      break;
  }
}

