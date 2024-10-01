import {
  ChangeDetectionStrategy, Component,
  input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-app-json-details-card',
  templateUrl: './app-json-details-card.component.html',
  styleUrls: ['./app-json-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppJsonDetailsCardComponent<T> {
  readonly isLoading = input<boolean>();
  readonly jsonDetails = input<T[]>();
  readonly title = input<string>();

  getKeys(item: T): string[] {
    return Object.keys(item);
  }

  getValueByKey(item: T, key: string): string {
    return (item as Record<string, string>)[key];
  }
}
