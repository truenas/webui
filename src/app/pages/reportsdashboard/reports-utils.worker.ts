/// <reference lib="webworker" />


// Write a bunch of pure functions above
// and add it to our commands below
const debug:boolean = true;

function maxDecimals(input, max?){
  if(!max){ max = 2; }
  const str = input.toString().split(".");
  if(!str[1]){
    console.warn("not a float...")
    // Not a float
    return input;
  }
  const decimals = str[1].length;
  const output = decimals > max ? input.toFixed(2): input;
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
  avgCpuTempReport: (input) => {
    let output = avgCpuTempReport(input);
    return output;
  },
  arrayAvg: (input) => {
    let output = arrayAvg(input);
    return output;
  },
  maxDecimals: (input) => {
    let output = maxDecimals(input);
    return output;
  },
}

function processCommands(list){
  let output;
  list.forEach((item, index) => {
    console.log(item);
    let input = item.input == '--pipe' || item.input == '|' ? output : item.input;
    output = commands[item.command](input);

  });

  console.log(output);
  return output;
}

function emit(evt){
//@ts-ignore
  postMessage(evt);
}

addEventListener('message', ({ data }) => {
  let evt = data;
  if(debug){
    console.warn("RCVD");
    console.warn(evt);
  }

  switch(evt.name){
    case 'SayHello':
      const response = evt.data + " World!";
      emit({name: 'Response', data: response});
    break;
    case 'ProcessCommands':
      let output = processCommands(evt.data);
      emit({name: 'Response', data: output, sender: evt.sender });
    break;
  }
});
