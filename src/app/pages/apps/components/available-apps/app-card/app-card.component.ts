import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interface';

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
    return this.app.description.length > 150 ? `${this.app.description.substring(0, 150)}...` : this.app.description;
  }
}
