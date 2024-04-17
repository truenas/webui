import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnclosureUi } from 'app/interfaces/enclosure.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable()
export class EnclosureService {
  constructor(
    private ws: WebSocketService,
  ) {}

  getEnclosure(): Observable<EnclosureUi[]> {
    return this.ws.call('webui.enclosure.dashboard');
  }
}
