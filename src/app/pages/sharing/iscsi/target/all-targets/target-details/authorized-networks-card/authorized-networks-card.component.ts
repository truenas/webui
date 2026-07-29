import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';

@Component({
  selector: 'ix-authorized-networks-card',
  styleUrls: ['./authorized-networks-card.component.scss'],
  templateUrl: './authorized-networks-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
  ],
})
export class AuthorizedNetworksCardComponent {
  readonly target = input.required<IscsiTarget>();
}
