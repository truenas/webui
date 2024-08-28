import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-true-command-status',
  templateUrl: './true-command-status.component.html',
  styleUrls: ['./true-command-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrueCommandStatusComponent {
  protected isManagedByTruecommand$ = this.ws.call('truenas.managed_by_truecommand');

  constructor(
    private ws: WebSocketService,
  ) {}
}
