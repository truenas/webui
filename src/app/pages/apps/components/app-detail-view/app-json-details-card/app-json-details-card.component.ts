import {
  ChangeDetectionStrategy, Component,
  Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { toHumanReadableKey } from 'app/helpers/object-keys-to-human-readable.helper';

@UntilDestroy()
@Component({
  selector: 'ix-app-json-details-card',
  templateUrl: './app-json-details-card.component.html',
  styleUrls: ['./app-json-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppJsonDetailsCardComponent<T> {
  @Input() isLoading$: Observable<boolean>;
  @Input() jsonDetails: T[];
  @Input() title: string;

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
