import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  constructor(protected ws: WebSocketService) {}

  getSmbBindIPChoices(): Observable<any[]> {
    return this.ws.call('smb.bindip_choices');
  }

  // OpenVPN Service
  getOpenVPNClientAuthAlgorithmChoices(): Observable<any[]> {
    return this.ws.call('openvpn.client.authentication_algorithm_choices');
  }

  getOpenVPNClientCipherChoices(): Observable<any[]> {
    return this.ws.call('openvpn.client.cipher_choices');
  }
  getCerts(): Observable<Certificate[]> {
    return this.ws.call('certificate.query');
  }

  getCAs(): Observable<any[]> {
    return this.ws.call('certificateauthority.query');
  }

  getOpenVPNServerAuthAlgorithmChoices(): Observable<any[]> {
    return this.ws.call('openvpn.server.authentication_algorithm_choices');
  }

  getOpenServerCipherChoices(): Observable<any[]> {
    return this.ws.call('openvpn.server.cipher_choices');
  }

  generateOpenServerClientConfig(id: number, address: string): Observable<any> {
    return this.ws.call('openvpn.server.client_configuration_generation', [id, address]);
  }
  renewStaticKey(): Observable<any> {
    return this.ws.call('openvpn.server.renew_static_key');
  }
  updateOpenVPN(call: ApiMethod, body: any): Observable<any> {
    return this.ws.call(call, [body]);
  }
  getClientInfo(): Observable<any> {
    return this.ws.call('openvpn.client.config');
  }

  // -- end of OpenVPN Service
  getLLDPCountries(): Observable<any[]> {
    return this.ws.call('lldp.country_choices');
  }
}
