import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { OpenvpnServerConfig } from 'app/interfaces/openvpn-server-config.interface';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  constructor(protected ws: WebSocketService) {}

  getOpenVpnClientAuthAlgorithmChoices(): Observable<Choices> {
    return this.ws.call('openvpn.client.authentication_algorithm_choices');
  }

  getOpenVpnClientCipherChoices(): Observable<Choices> {
    return this.ws.call('openvpn.client.cipher_choices');
  }
  getCerts(): Observable<Certificate[]> {
    return this.ws.call('certificate.query');
  }

  getCertificateAuthorities(): Observable<CertificateAuthority[]> {
    return this.ws.call('certificateauthority.query');
  }

  getOpenVpnServerAuthAlgorithmChoices(): Observable<Choices> {
    return this.ws.call('openvpn.server.authentication_algorithm_choices');
  }

  getOpenServerCipherChoices(): Observable<Choices> {
    return this.ws.call('openvpn.server.cipher_choices');
  }

  generateOpenServerClientConfig(id: number, address: string): Observable<string> {
    return this.ws.call('openvpn.server.client_configuration_generation', [id, address]);
  }
  renewStaticKey(): Observable<OpenvpnServerConfig> {
    return this.ws.call('openvpn.server.renew_static_key');
  }
}
