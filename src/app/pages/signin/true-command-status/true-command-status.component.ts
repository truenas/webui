import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-true-command-status',
  templateUrl: './true-command-status.component.html',
  styleUrls: ['./true-command-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    AsyncPipe,
    IxIconComponent,
  ],
})
export class TrueCommandStatusComponent {
  protected isManagedByTruecommand$ = this.ws.call('truenas.managed_by_truecommand');

  constructor(
    private ws: WebSocketService,
  ) {}
}
