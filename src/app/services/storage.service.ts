import {Injectable} from '@angular/core';
import {WebSocketService} from './ws.service';

@Injectable()
export class StorageService {
    constructor(protected ws: WebSocketService) {}

    filesystemStat(path: string) {
        return this.ws.call('filesystem.stat', [path])
    }
}