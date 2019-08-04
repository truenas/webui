/// <reference lib="webworker" />


// Write a bunch of pure functions above
// and add it to our commands below
const debug:boolean = true;

const maxDecimals = (input, max?) => {
  if(!max){ 
    max = 2; 
  }
  const str = input.toString().split(".");
  if(!str[1]){
    // Not a float
    return input;
  }
  const decimals = str[1].length;
  const output = decimals > max ? input.toFixed(max): input;
  return parseFloat(output);
}

function arrayAvg(input){
  let sum = input.reduce((acc, cv) => acc + cv);
  let avg = sum / input.length;
  return maxDecimals(avg);
}

function avgFromReportData(input){
  let output = []; 
  input.forEach((item, index) => {
    let avg = arrayAvg(item);
    output.push([avg]);
  });
  return output;
}

function optimizeLegend(input){
  console.warn(input);
  let output = input;
  // Do stuff
  switch(input.name){
    case 'load':
      output.legend = output.legend.map((label) => label.replace(/load_/, ''))
      break;
    case 'disktemp':
      output.legend = ['temperature'];
      break;
    case 'memory':
      output.legend = output.legend.map((label) => label.replace(/memory-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'swap':
      output.legend = output.legend.map((label) => label.replace(/swap-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'interface':
      output.legend = output.legend.map((label) => label.replace(/if_/, ''))
      output.legend = output.legend.map((label) => label.replace(/octets_/, 'octets '))
      break;
    case 'nfsstat':
      output.legend = output.legend.map((label) => label.replace(/nfsstat-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'df':
      output.legend = output.legend.map((label) => label.replace(/df_complex-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'processes':
      output.legend = output.legend.map((label) => label.replace(/ps_state-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'uptime':
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'ctl':
      output.legend = output.legend.map((label) => label.replace(/disk_octets_/, ''))
      break;
    case 'arcsize':
      output.legend = output.legend.map((label) => label.replace(/cache_size-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'arcratio':
      output.legend = output.legend.map((label) => label.replace(/cache_ratio-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
    case 'arcresult':
      output.legend = output.legend.map((label) => label.replace(/cache_result-demand_data-/, ''))
      output.legend = output.legend.map((label) => label.replace(/cache_result-demand_metadata-/, ''))
      output.legend = output.legend.map((label) => label.replace(/_value/, ''))
      break;
  }
  return output;
}

function avgCpuTempReport(report){
  let output = Object.assign({}, report);
  // Handle Data
  output.data = avgFromReportData(report.data);

  //Handle Legend
  output.legend = ["Avg Temp"];

  //Handle Aggregations
  const keys = Object.keys(output.aggregations);
  keys.forEach((key, index) =>{ 
    output.aggregations[key] = arrayAvg(output.aggregations[key]);
  });
  
  return output;
}

// Pseudo command line interface
// we can call the worker's functions
// using text input. The Unix way ;-)
const commands = {
  // POC commands
  echo: (input) => {
    console.log(input);
    return input;
  },
  toLowerCase: (input) => {
    let output = input.toLowerCase();
    console.log(output);
    return output;
  },
  length: (input) => {
    let output = input.length;
    console.log(output);
    return output;
  },
  avgFromReportData: (input) => {
    let output = avgFromReportData(input);
    return output;
  },
  optimizeLegend: (input) => {
    let output = optimizeLegend(input);
    return output;
  },
  avgCpuTempReport: (input) => {
    let output = avgCpuTempReport(input);
    return output;
  },
  arrayAvg: (input) => {
    let output = arrayAvg(input);
    return output;
  },
  maxDecimals: (input, options?) => {
    let output = options ? maxDecimals(input, ...options) : maxDecimals(input);
    return output;
  },
}

function processCommands(list){
  let output;
  list.forEach((item, index) => {
    let input = item.input == '--pipe' || item.input == '|' ? output : item.input;
    output = item.options ? commands[item.command](input, item.options) : commands[item.command](input);

  });

  return output;
}

function emit(evt){
//@ts-ignore
  postMessage(evt);
}

addEventListener('message', ({ data }) => {
  let evt = data;
  let output;
  if(debug){
    //console.warn("RCVD");
    //console.warn(evt);
  }

  switch(evt.name){
    case 'SayHello':
      const response = evt.data + " World!";
      emit({name: 'Response', data: response});
    break;
    case 'ProcessCommands':
      output = processCommands(evt.data);
      emit({name: 'Response', data: output, sender: evt.sender });
    break;
    case 'ProcessCommandsAsReportData':
      output = processCommands(evt.data);
      emit({name: 'ReportData', data: output, sender: evt.sender });
    break;
  }
});
