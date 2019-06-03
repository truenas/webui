import { Injectable } from '@angular/core';

import { WebSocketService } from './ws.service';

@Injectable()
export class ReplicationService {

    constructor(protected ws: WebSocketService) { };

    getSnapshotTasks() {
        return this.ws.call('pool.snapshottask.query');
    }

    querySSHConnection(id) {
        return this.ws.call('keychaincredential.query', [[["id", "=", id]]]);
    }

    genSSHKeypair() {
        return this.ws.call('keychaincredential.generate_ssh_key_pair').toPromise();
    }
}