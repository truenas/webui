import { Pipe, PipeTransform } from '@angular/core';
import { flattenEmptyConfigMessage } from 'app/helpers/empty-config.helper';

/**
 * Flattens an `EmptyConfig.message` to plain text for `tn-empty`'s text inputs.
 *
 * Chain it after `translate` so the catalog key stays the source of truth and the result
 * follows a language change:
 *
 * ```html
 * [title]="emptyConfig.message | translate | flattenEmptyMessage"
 * ```
 */
@Pipe({
  name: 'flattenEmptyMessage',
})
export class FlattenEmptyMessagePipe implements PipeTransform {
  transform(message: string): string {
    return flattenEmptyConfigMessage(message);
  }
}
