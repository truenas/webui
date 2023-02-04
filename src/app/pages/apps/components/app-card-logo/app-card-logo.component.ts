import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { StateChange } from 'ng-lazyload-image';
import { officialCatalog, appImagePlaceholder } from 'app/constants/catalog.constants';
import { LayoutService } from 'app/services/layout.service';

@Component({
  selector: 'ix-app-card-logo',
  templateUrl: './app-card-logo.component.html',
  styleUrls: ['./app-card-logo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCardLogoComponent {
  @Input() url: string;

  wasLogoLoaded = false;

  readonly scrollTarget = this.layoutService.getContentContainer();
  readonly officialCatalog = officialCatalog;
  readonly appImagePlaceholder = appImagePlaceholder;

  constructor(
    private cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
  ) {}

  onLogoLoaded(event: StateChange): void {
    if (event.reason !== 'loading-succeeded') {
      return;
    }

    this.wasLogoLoaded = true;
    this.cdr.detectChanges();
  }
}
