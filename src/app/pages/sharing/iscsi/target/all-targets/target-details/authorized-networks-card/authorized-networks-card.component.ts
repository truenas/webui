import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';

@Component({
  selector: 'ix-authorized-networks-card',
  styleUrls: ['./authorized-networks-card.component.scss'],
  templateUrl: './authorized-networks-card.component.html',
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
export class AuthorizedNetworksCardComponent {
  readonly target = input.required<IscsiTarget>();
}
