import {
  ChangeDetectionStrategy, Component, inject, input,
  signal,
} from '@angular/core';
import {
  LAZYLOAD_IMAGE_HOOKS, LazyLoadImageModule, ScrollHooks, StateChange,
} from 'ng-lazyload-image';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { LayoutService } from 'app/services/layout.service';

@Component({
  selector: 'ix-app-card-logo',
  templateUrl: './app-card-logo.component.html',
  styleUrls: ['./app-card-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LazyLoadImageModule],
  providers: [{ provide: LAZYLOAD_IMAGE_HOOKS, useClass: ScrollHooks }],
})
export class AppCardLogoComponent {
  readonly url = input<string>();
  protected wasLogoLoaded = signal(false);

  private layoutService = inject(LayoutService);

  readonly scrollTarget = this.layoutService.getContentContainer();
  readonly appImagePlaceholder = appImagePlaceholder;

  onLogoLoaded(event: StateChange): void {
    if (event.reason !== 'loading-succeeded') {
      return;
    }

    this.wasLogoLoaded.set(true);
  }
}
