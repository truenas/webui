import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnTooltipDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-app-available-info-card',
  templateUrl: './app-available-info-card.component.html',
  styleUrls: ['./app-available-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormatDateTimePipe,
    TnCardComponent,
    TnTooltipDirective,
    NgxSkeletonLoaderModule,
    OrNotAvailablePipe,
    TranslateModule,
    TestDirective,
    CleanLinkPipe,
  ],
})
export class AppAvailableInfoCardComponent {
  readonly isLoading = input<boolean>(true);
  readonly app = input<AvailableApp>();
}
