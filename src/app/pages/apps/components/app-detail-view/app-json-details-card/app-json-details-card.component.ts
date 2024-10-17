import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { toHumanReadableKey } from 'app/helpers/object-keys-to-human-readable.helper';

@UntilDestroy()
@Component({
  selector: 'ix-app-json-details-card',
  templateUrl: './app-json-details-card.component.html',
  styleUrls: ['./app-json-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgxSkeletonLoaderModule,
    TranslateModule,
  ],
})
export class AppJsonDetailsCardComponent<T> {
  readonly isLoading = input<boolean>();
  readonly jsonDetails = input<T[]>();
  readonly title = input<string>();

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
