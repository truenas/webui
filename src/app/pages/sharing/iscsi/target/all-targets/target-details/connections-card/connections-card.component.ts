import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { ApiService } from 'app/services/websocket/api.service';

@Component({
  selector: 'ix-connections-card',
  styleUrls: ['./connections-card.component.scss'],
  templateUrl: './connections-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatCardContent,
  ],
})
export class ConnectionsCardComponent {
  sessions = toSignal(this.api.call('iscsi.global.sessions').pipe(
    map(() => {
      return [{
        initiator: 'inr1',
        initiator_addr: '10.0.0.1',
      }] as IscsiGlobalSession[];
    }),
  ));

  constructor(
    private api: ApiService,
  ) {}
}
