import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject, Subscription} from 'rxjs';

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

  getOpenVPNServerAuthAlgorithmChoices() {
    return this.ws.call('openvpn.server.authentication_algorithm_choices');
  }

  getOpenServerCipherChoices() {
    return this.ws.call('openvpn.server.cipher_choices');
  }
  
  generateOpenServerClientConfig(id: number, address: string) {
    return this.ws.call('openvpn.server.client_configuration_generation', [id, address]);
  }
  renewStaticKey() {
    return this.ws.call('openvpn.server.renew_static_key');
  }
  updateOpenVPN(call, body) {
    return this.ws.call(call, [body]);
  }
  getClientInfo() {
    return this.ws.call('openvpn.client.config');
  }
 
  // -- end of OpenVPN Service
  getLLDPCountries() {
    return this.ws.call('lldp.country_choices');
  }
}
