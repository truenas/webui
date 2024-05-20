import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { AppMetadata } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-metadata-card',
  templateUrl: './app-metadata-card.component.html',
  styleUrls: ['./app-metadata-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppMetadataCardComponent {
  readonly appMetadata = input<AppMetadata>();
  readonly maxHeight = input(250);
}
