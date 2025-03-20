import {
  ChangeDetectionStrategy, Component, inject, input,
  signal,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { LazyLoadImageModule, StateChange } from 'ng-lazyload-image';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { LayoutService } from 'app/modules/layout/layout.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-card-logo',
  templateUrl: './app-card-logo.component.html',
  styleUrls: ['./app-card-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LazyLoadImageModule],
})
export class AppCardLogoComponent {
  url = input.required<string>();
  protected wasLogoLoaded = signal(false);

  private layoutService = inject(LayoutService);

  protected readonly scrollTarget = this.layoutService.getContentContainer();
  protected readonly appImagePlaceholder = appImagePlaceholder;

  protected onLogoLoaded(event: StateChange): void {
    if (event.reason !== 'loading-succeeded') {
      return;
    }

    this.wasLogoLoaded.set(true);
  }
}
