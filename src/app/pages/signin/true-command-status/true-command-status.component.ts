import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-true-command-status',
  templateUrl: './true-command-status.component.html',
  styleUrls: ['./true-command-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    AsyncPipe,
    TnIconComponent,
  ],
})
export class TrueCommandStatusComponent {
  private api = inject(ApiService);

  protected isManagedByTruecommand$ = this.api.call('truenas.managed_by_truecommand');
}
