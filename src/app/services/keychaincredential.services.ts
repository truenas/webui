import { Injectable } from '@angular/core';

import { WebSocketService } from './ws.service';

@Injectable()
export class KeychainCredentialService {

    constructor(protected ws: WebSocketService) { }

    getSSHKeys() {
        return this.ws.call('keychaincredential.query', [[["type", "=", "SSH_KEY_PAIR"]]]);
    }

    getSSHConnections() {
        return this.ws.call('keychaincredential.query', [[["type", "=", "SSH_CREDENTIALS"]]]);
    }
}