/// <reference lib="webworker" />
//import { CoreEvent } from 'app/core/services/core.service';

const debug:boolean = true;

function emit(evt){
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
  }
  //let evt:CoreEvent = data;
  //const response = evt.data + " World!";
  //this.postMessage(response);
  //this.postMessage('message',{eventName: "response" + evt.sender, sender: evt.sender});
});
