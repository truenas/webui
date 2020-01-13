import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {WebSocketService} from './ws.service';

@Injectable({providedIn: 'root'})
export class ServicesService {
  constructor(protected ws: WebSocketService) {};
  
  getSmbBindIPChoices() {
    return this.ws.call('smb.bindip_choices');
  }

  // OpenVPN Service
  getOpenVPNClientAuthAlgorithmChoices() {
    return this.ws.call('openvpn.client.authentication_algorithm_choices');
  }

  getOpenVPNClientCipherChoices() {
    return this.ws.call('openvpn.client.cipher_choices');
  }
  getCerts() {
    return this.ws.call('certificate.query');
  }

  getCAs() {
    return this.ws.call('certificateauthority.query');
  }
 

  // -- end of OpenVPN Service
}
