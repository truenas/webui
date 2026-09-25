import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnTestIdDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { IsHaDirective } from 'app/directives/is-ha/is-ha.directive';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';

@Component({
  selector: 'ix-fibre-channel-port-card',
  styleUrls: ['./fibre-channel-port-card.component.scss'],
  templateUrl: './fibre-channel-port-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
    NgxSkeletonLoaderModule,
    IsHaDirective,
    TnTestIdDirective,
  ],
})
export class FibreChannelPortCardComponent {
  readonly ports = input.required<FibreChannelPort[]>();
  readonly isLoading = input.required<boolean>();
}
