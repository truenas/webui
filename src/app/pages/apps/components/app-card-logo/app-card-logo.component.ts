import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, input,
  signal,
} from '@angular/core';
import {
  IntersectionObserverHooks,
  LAZYLOAD_IMAGE_HOOKS, LazyLoadImageModule, StateChange,
} from 'ng-lazyload-image';
import { officialCatalog, appImagePlaceholder } from 'app/constants/catalog.constants';
import { LayoutService } from 'app/services/layout.service';

@Component({
  selector: 'ix-app-card-logo',
  templateUrl: './app-card-logo.component.html',
  styleUrls: ['./app-card-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf, LazyLoadImageModule],
  providers: [{ provide: LAZYLOAD_IMAGE_HOOKS, useClass: IntersectionObserverHooks }],
})
export class AppCardLogoComponent {
  readonly url = input<string>();
  protected wasLogoLoaded = signal(false);

  layoutService = inject(LayoutService);

  readonly scrollTarget = this.layoutService.getContentContainer();
  readonly officialCatalog = officialCatalog;
  readonly appImagePlaceholder = appImagePlaceholder;

  onLogoLoaded(event: StateChange): void {
    if (event.reason !== 'loading-succeeded') {
      return;
    }

    this.wasLogoLoaded.set(true);
  }
}
