import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { toHumanReadableKey } from 'app/helpers/object-keys-to-human-readable.helper';

@Component({
  selector: 'ix-app-json-details-card',
  templateUrl: './app-json-details-card.component.html',
  styleUrls: ['./app-json-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxSkeletonLoaderModule,
    TranslateModule,
    TnCardComponent,
  ],
})
export class AppJsonDetailsCardComponent<T extends object> {
  readonly isLoading = input<boolean>();
  readonly jsonDetails = input<T[]>();
  readonly title = input.required<string>();

  getKeys(item: T): string[] {
    return Object.keys(item);
  }

  getHumanReadableKey(key: string): string {
    return toHumanReadableKey(key);
  }

  getValueByKey(item: T, key: string): string {
    return (item as Record<string, string>)[key];
  }
}
