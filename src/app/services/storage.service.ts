import { Injectable } from '@angular/core';
import { WebSocketService } from './ws.service';
import { RestService } from './rest.service';

@Injectable()
export class StorageService {
  protected diskResource: string = 'storage/disk';

  constructor(protected ws: WebSocketService, protected rest: RestService) {}

  filesystemStat(path: string) {
    return this.ws.call('filesystem.stat', [path])
  }

  listDisks() {
    return this.rest.get(this.diskResource, { limit: 50 });
  }

  // Sorts array by disk names into 'natural' order
  mySorter(myArray, key) {
  let tempArr = [];
  myArray.forEach((item) => {
    tempArr.push(item[key]);
  })
  // The Intl Collator allows language-sensitive str comparison and can allow for numbers
  let myCollator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
  // Sort devnames (only) into 'natural' order
  let sorter = tempArr.sort(myCollator.compare);

  // Takes the disk list and matches it to the sorted array of devnames only    
  myArray.sort((a, b) => {
    let A = a[key], B = b[key];
    if (sorter.indexOf(A) > sorter.indexOf(B)) {
      return 1;
    } else {
      return -1;
    }
  });
  return myArray
  }

  downloadFile(filename, contents, mime_type){
    mime_type = mime_type || "text/plain";

    let byteCharacters = atob(contents);

    let byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    let byteArray = new Uint8Array(byteNumbers);

    let blob = new Blob([byteArray], {type: mime_type});

    let dlink = document.createElement('a');
    document.body.appendChild(dlink);
    dlink.download = filename;
    dlink.href =  window.URL.createObjectURL(blob);
    dlink.onclick = function(e) {
        // revokeObjectURL needs a delay to work properly
        var that = this;
        setTimeout(function() {
            window.URL.revokeObjectURL(that['href']);
        }, 1500);
    };

    dlink.click();
    dlink.remove();
  }
}
