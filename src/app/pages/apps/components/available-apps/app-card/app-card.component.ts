import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interfase';

@Component({
  selector: 'ix-app-card',
  templateUrl: './app-card.component.html',
  styleUrls: ['./app-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCardComponent {
  @Input() app: AvailableApp;

  readonly officialCatalog = officialCatalog;

  get description(): string {
    // TODO: This temporarily uses incorrect field. This is supposed to be a short description with no html tags.
    const description = this.app.app_readme.replace(/<[^>]*>/g, '');
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  }
}
