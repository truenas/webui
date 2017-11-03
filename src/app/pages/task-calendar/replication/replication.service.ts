import {Injectable} from '@angular/core';

import {WebSocketService} from '../../../services';
import { Observable } from 'rxjs/Observable';



@Injectable()
export class ReplicationService {
 
  constructor(private _ws: WebSocketService) {}

  public getSSHKeyscan(host: string, port: number): Observable<any> {
    return this._ws.call('replication.ssh_keyscan', [host, port]);
  }


  public getSSHPublicKeyscan(): Observable<any> {
    return this._ws.call('replication.public_key');
  }


}
