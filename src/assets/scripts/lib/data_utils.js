var debug = false;


// ***************************************************** FROM SERVICE FILE (START) ***************************************************

  const lineChart = "Line";
  const pieChart = "Pie";

  const generateMetaData = (res) => {
    // This should ideally be done server side but putting it in so we can have proper labels 
    // in time for 11.2 release

    const spl = res.meta.legend[0].split('/');
    const prefix = spl[0];
    const dataName = spl[1];

    let dictionary = [
      {source :'aggregation-cpu-sum', units:'%', labelY:'% CPU'},
      {source :'temperature', units:'°C', labelY:'Celsius', conversion:'decikelvinsToCelsius'},
      {source :'memory', units:'GiB', labelY:'Gigabytes', removePrefix:'memory-', conversion: 'bytesToGigabytes'},
      {source :'swap', units:'GiB', labelY:'Gigabytes', removePrefix:'swap-'},
      {source :'if_errors', units:'', labelY:'Bits/s'},
      {source :'if_octets', units:'', labelY:'Bits/s'},
      {source :'if_packets', units:'', labelY:'Bits/s'},
      {source :'df-mnt-', units:'GiB', labelY: 'Gigabytes', removePrefix:'df_complex-'},
      {source :'ctl-tpc', units:'GiB', labelY: 'Gigabytes/s', removePrefix:'disk_', conversion: 'bytesToGigabytes'},
      {source :'ctl-iscsi', units:'GiB', labelY: 'Gigabytes/s', removePrefix:'disk_', conversion: 'bytesToGigabytes'},
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

  /* ******************** TAKEN FROM LINECHART COMPONENT *********************** */


  function convertTo (value, conversion, dataList/* <---- pass this in somehow!! */){
    let result;
    switch(conversion){
    case 'bytesToGigabytes':
      result = value / 1073741824;
      break;
    case 'percentFloatToInteger':
      result = value * 100;
      break;
    case 'decikelvinsToCelsius':
      if(value !== null ){
        result = dataList[0].source.startsWith('cputemp-') ? (value / 10) - 273.15 : value;
      } else {
        result = null
      }
      break;
    }

    return result !== null ? result.toFixed(2) : result;
  }

  function getMin(arr){
    return Math.min(...arr);
  }

  function getMax(arr){
    return Math.max(...arr);
  }

  function getAvg(arr){
    return 1;
  }

  function getLast(arr){
    return 1;
  }


  // Analytics
  function analyze(columns){
    let allColumns = [];
    let cols = Object.assign([], columns);
    // Remove X axis
    cols.shift(columns[0]);

    for(let i = 0; i < cols.length; i++){
      // Middleware provides data as strings
      // so we store the label (first item) 
      // and convert the rest to numbers
      let colStrings = cols[i];
      let label = colStrings[0];
      let col = colStrings.map(x => Number(x));
      col.shift(col[0]);
      
      let total = col.length > 0 ? col.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue)) : "N/A";
      let avg = total !== "N/A" ? Number((total / col.length).toFixed(2)) : total;
      let myResult= {
        label:label,
        min: total !== "N/A" ? getMin(col) : total ,
        max: total !== "N/A" ? getMax(col) : total,
        avg: avg,
        last: total !== "N/A" ? Number(col[col.length - 1].toFixed(2)) : total,
        total: total !== "N/A" ? Number(total.toFixed(2)) : total
      }
      allColumns.push(myResult);
    }
    return allColumns;
  }

  function handleDataFunc(linechartData, dataList, legends){
    data = {
      labels: [],
      series: []
    }
    
    data.labels.splice(0, data.labels.length);
    data.series.splice(0, data.series.length);

    linechartData.labels.forEach((label) => {data.labels.push(new Date(label))});
    linechartData.series.forEach((dataSeriesArray) => {
    
    const newArray = [];
    if(!linechartData.meta)console.log(linechartData);
    if (linechartData.meta.conversion == 'decikelvinsToCelsius') {
        dataSeriesArray.forEach((numberVal) => {
            newArray.push(convertTo(numberVal, linechartData.meta.conversion, dataList));
        });
        
        dataSeriesArray = newArray;
    } else if (typeof (divideBy) !== 'undefined' || linechartData.meta.conversion) {
        dataSeriesArray.forEach((numberVal) => {
          if(linechartData.meta.conversion){
            newArray.push(convertTo(numberVal, linechartData.meta.conversion, dataList));
          } else if (numberVal > 0) {
            newArray.push((numberVal / divideBy).toFixed(2));
          } else {
            newArray.push(numberVal);
          }
        });
        
        dataSeriesArray = newArray;
      } else { 
        dataSeriesArray.forEach((numberVal) => {
          if(numberVal > 0){
            newArray.push(numberVal.toFixed(2));
          } else {
            newArray.push(numberVal);
          }
        });
        dataSeriesArray = newArray;
      }
  
      data.series.push(dataSeriesArray);
    });

    const columns = [];
    let legendLabels = [];

    // xColumn
    const xValues = [];
    xValues.push('xValues');
    data.labels.forEach((label) => {
      xValues.push(label);
    });

    columns.push(xValues);

    // For C3.. Put the name of the series as the first element of each series array
    for (let i = 0; i < legends.length && data.series.length; ++i) {
      let legend;
      if(linechartData.meta.removePrefix){
        legend  = legends[i].replace(linechartData.meta.removePrefix, "");
      } else {
        legend  = legends[i];
      }

      legendLabels.push(legend);

      let series = data.series[i];
      if( typeof(series) !== 'undefined' && series.length > 0 ) {
        series.unshift(legend);
      } else {
        series = [legend];
      }
      columns.push(series);
    }


    let legendAnalytics = analyze(columns);
    return {columns: columns, linechartData:linechartData, legendLabels: legendLabels, legendAnalytics: legendAnalytics, dataObj: data}
  }
  

  /********************* HANDLERS ******************************/

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

      let handledData = handleDataFunc(linechartData, dataList, data.legends);
      self.postMessage({name:"LineChartData:" + data.title, data : handledData});
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

