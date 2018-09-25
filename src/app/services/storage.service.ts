import { Injectable } from '@angular/core';
import { WebSocketService } from './ws.service';
import { RestService } from './rest.service';

@Injectable()
export class StorageService {
  protected diskResource: string = 'disk.query';

  constructor(protected ws: WebSocketService, protected rest: RestService) {}

  filesystemStat(path: string) {
    return this.ws.call('filesystem.stat', [path])
  }

  listDisks() {
    return this.ws.call(this.diskResource, []);
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

  // Handles sorting for eneity tables and some other ngx datatables 
  tableSorter(arr, key, asc) {
    let tempArr = [],
      sorter,
      myCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    
    // Breaks out the key to sort by
    arr.forEach((item) => {
      tempArr.push(item[key]);
    });

    // Select table columns labled with GiB, Mib, etc
    // Regex checks for ' XiB' with a leading space and X === K, M, G or T 
    if (typeof(tempArr[0]) === 'string' && 
      (tempArr[0].slice(-2) === ' B' || /\s[KMGT]iB$/.test(tempArr[0].slice(-4) ))) {

    let bytes = [], kbytes = [], mbytes = [], gbytes = [], tbytes = [];
    for (let i of tempArr) {
      if (i.slice(-2) === ' B') {
        bytes.push(i);
      } else {
        switch (i.slice(-3)) {
          case 'KiB':
            kbytes.push(i);
            break;
          case 'MiB':
            mbytes.push(i);
            break;
          case 'GiB':
            gbytes.push(i);
            break;
          case 'TiB':
            tbytes.push(i);
        }
      }
    }

    // Sort each array independently, then put them back together
    bytes = bytes.sort(myCollator.compare);
    kbytes = kbytes.sort(myCollator.compare);
    mbytes = mbytes.sort(myCollator.compare);
    gbytes = gbytes.sort(myCollator.compare);
    tbytes = tbytes.sort(myCollator.compare);
    
    sorter = bytes.concat(kbytes, mbytes, gbytes, tbytes)

  } else {
      sorter = tempArr.sort(myCollator.compare);
    }
      // Rejoins the sorted keys with the rest of the row data
      let v;
      // ascending or decending
      asc==='asc' ? (v = 1) : (v = -1);
      arr.sort((a, b) => {
        const A = a[key],
            B = b[key];
        if (sorter.indexOf(A) > sorter.indexOf(B)) {
            return 1 * v;
        } else {
            return -1 * v;
        }
      });
          
    return arr;
  } 
}
