import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class ServicesService {
  constructor(protected ws: WebSocketService) {}

  getCerts(): Observable<Certificate[]> {
    return this.ws.call('certificate.query');
  }

  getCertificateAuthorities(): Observable<CertificateAuthority[]> {
    return this.ws.call('certificateauthority.query');
  }
}
