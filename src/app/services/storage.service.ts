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
}
