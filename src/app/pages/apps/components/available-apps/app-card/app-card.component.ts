import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { StateChange } from 'ng-lazyload-image';
import { appImagePlaceholder, officialCatalog } from 'app/constants/catalog.constants';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { LayoutService } from 'app/services/layout.service';

@Component({
  selector: 'ix-app-card',
  templateUrl: './app-card.component.html',
  styleUrls: ['./app-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCardComponent {
  @Input() app: CatalogApp;
  @Input() installed: boolean;

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

  get description(): string {
    // TODO: This temporarily uses incorrect field. This is supposed to be a short description with no html tags.
    const description = this.app.app_readme.replace(/<[^>]*>/g, '');
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  }
}
