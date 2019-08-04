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

function inferUnits(label:string){
  // Figures out from the label what the unit is
  let units = label;
  if(label.includes('%')){
    units = '%';
  } else if(label.includes('°')){
    units = "°";
  } else if(label.toLowerCase().includes("bytes")){
    units = "bytes";
  } else if(label.toLowerCase().includes("bits")){
    units = "bits";
  }

  if(typeof units == 'undefined'){
    console.warn("Could not infer units from " + label);
  }

  return units;
}

function  convertKMGT(input: number, units: string, fixed?: number){
  const kilo = 1024;
  const mega = kilo * 1024;
  const giga = mega * 1024;
  const tera = giga * 1024;

  let prefix: string = '';
  let shortName: string = '';
  let output: number = input;

  if(input > tera){
    prefix = "Tera";
    shortName = "TiB"
    output = input / tera;
  } else if(input < tera && input > giga ){
    prefix = "Giga";
    shortName = "GiB"
    output = input / giga;
  } else if(input < giga && input > mega){
    prefix = "Mega";
    shortName = "MiB"
    output = input / mega;
  } else if(input < mega && input > kilo){
    prefix = "Kilo";
    shortName = "KB"
    output = input / kilo;
  }

  console.warn(units);
  if(units == 'bits'){
    shortName = shortName.replace(/i/, '');
    shortName = shortName.toLowerCase();
  }
 
  //if(fixed && fixed !== -1){
  //  return [output.toFixed(fixed), prefix];
  //} else {
  //  return [output.toString(), prefix];
  //}
  
  return { value: output, prefix: prefix, shortName: shortName }; 
}

function convertByKilo(input){
  if(typeof input !== 'number'){return input}
  let output = input;
  let prefix: string = ''; 
  let suffix = '';

  if(input >= 1000000){    
    output = input / 1000000;
    suffix = 'm';
  } else if(input < 1000000 && input >= 1000 ){
    output = input / 1000;
    suffix = 'k';
  } 

  return { value: output, suffix: suffix };
}

function formatValue(value: number, units: string, fixed?: number){
  let output = value;
  if(!fixed){ fixed = -1; }
  if(typeof value !== 'number'){ return value;}

  let converted;
  switch(units.toLowerCase()){
    case "bits":
      converted  = convertKMGT(value, units, fixed);
      output = maxDecimals(converted.value).toString() + converted.shortName;
      break;
    case "bytes":
      converted = convertKMGT(value, units, fixed);
      output = maxDecimals(converted.value).toString() + converted.shortName;
      break;
    case "%":
    case "°":
    default:
      console.log(output);
      converted = convertByKilo(output);
      return typeof output == 'number' ? maxDecimals(converted.value).toString() + converted.suffix : value ;//[this.limitDecimals(value), ''];
      break;
  }

  return output; //? output : value;
}

function convertAggregations(input, labelY?){
  let output = Object.assign({}, input);
  const units = inferUnits(labelY);
  const keys = Object.keys(output.aggregations);

  keys.forEach((key) => {
    //output.aggregations[key].map((v) => formatValue(v , units) )
    output.aggregations[key].forEach((v, index) => { 
      output.aggregations[key][index] = formatValue(v , units) ;
    });
  });
  console.warn(output);
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
  convertAggregations: (input, options?) => {
    let output = options ? convertAggregations(input, ...options) : input;
    if(!options) {
      console.warn("You must specify a label to parse. (Usually the Y axis label). Returning input value instead");
    }
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
