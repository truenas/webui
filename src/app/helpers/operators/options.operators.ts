import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { uniq } from 'lodash-es';
import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { Choices } from 'app/interfaces/choices.interface';
import { MapOption, Option } from 'app/interfaces/option.interface';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';

/**
 * Convert choices to options
 * @returns Option[]
 */
export function choicesToOptions(): OperatorFunction<Choices, Option[]> {
  return map((choices) => {
    return Object.entries(choices).map(
      ([value, label]) => ({ label: ignoreTranslation(label), value }),
    );
  });
}

/**
 * Transfers array of tuples to array of options:
 * ```
 * [['value1', 'label1'], ['value2', 'label2']]
 * ```
 */
export function arrayToOptions(): OperatorFunction<MapOption[], Option[]> {
  return map((choices) => {
    return choices.map(([value, label]) => ({ label: ignoreTranslation(label), value }));
  });
}

/**
 * Transfers normal array to array of options:
 * ```
 * ['value1', 'value2', 'value3'],
 * ```
 */
export function singleArrayToOptions(): OperatorFunction<(string | number)[], Option[]> {
  return map((choices) => {
    return choices.map((choice) => ({ label: ignoreTranslation(String(choice)), value: choice }));
  });
}

export function redundantListToUniqueOptions(): OperatorFunction<string[], Option[]> {
  return map((redundantArray) => {
    return uniq(redundantArray).map((item: string) => ({ label: ignoreTranslation(item), value: item }));
  });
}

export function idNameArrayToOptions<T = number>(): OperatorFunction<{ id: T; name: string }[], Option<T>[]> {
  return map((options) => {
    return options.map((option) => ({ label: ignoreTranslation(option.name), value: option.id }));
  });
}

/**
 * Convert grouped NIC choices to flat options array
 * Handles both formats:
 * - New grouped format: `{ "BRIDGE": ["br0", "br1"], "MACVLAN": ["eth0"] }`
 * - Old flat format: `{ "br0": "br0", "eth0": "eth0" }`
 * Transforms to: `[{ label: "br0", value: "br0" }, ...]`
 * Special handling: Empty string values are converted to "Automatic" label for bridge selection
 *
 * Note: This operator intentionally flattens grouped choices for use in simple dropdowns
 * (e.g., VM device forms) where a plain list is sufficient.
 * Components that need to preserve grouping (e.g., AddNicMenuComponent) should
 * implement custom grouping logic instead of using this operator.
 *
 * @example
 * // ✅ DO use for simple flat dropdowns:
 * readonly nicOptions$ = this.api.call('vm.device.nic_attach_choices').pipe(
 *   nicChoicesToOptions()
 * );
 *
 * @example
 * // ❌ DON'T use for grouped dropdowns - implement custom grouping:
 * // See AddNicMenuComponent for an example of preserving group structure
 *
 * @returns Option[]
 */
export function nicChoicesToOptions(): OperatorFunction<Record<string, string | string[]>, Option[]> {
  return map((groupedChoices) => {
    const allInterfaces = Object.values(groupedChoices).flatMap((value) => {
      return Array.isArray(value) ? value : [value];
    });
    return allInterfaces.map((interfaceName) => ({
      label: interfaceName !== '' ? ignoreTranslation(interfaceName) : T('Automatic'),
      value: interfaceName,
    }));
  });
}
