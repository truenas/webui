import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { IsHaDirective } from 'app/directives/is-ha/is-ha.directive';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';

@Component({
  selector: 'ix-fibre-channel-port-card',
  styleUrls: ['./fibre-channel-port-card.component.scss'],
  templateUrl: './fibre-channel-port-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatCardContent,
    NgxSkeletonLoaderModule,
    IsHaDirective,
  ],
})
export class FibreChannelPortCardComponent {
  readonly ports = input.required<FibreChannelPort[]>();
  readonly isLoading = input.required<boolean>();
}
