import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { Choices } from 'app/interfaces/choices.interface';
import { Option } from 'app/interfaces/option.interface';

export function mapToOptions(map: Map<string, string>): Option[] {
  return Array.from(map.entries()).map(([value, label]) => ({ label, value }));
}

/**
 * Convert choices to options
 * @param [swap] use when value of object matched to option value
 * @default key of object matched to option value
 * @returns Option[]
 */
export function choicesToOptions(swap = false): OperatorFunction<Choices, Option[]> {
  return map((choices) => {
    if (swap) {
      return Object.entries(choices).map(([label, value]) => ({ label, value }));
    }
    return Object.entries(choices).map(([value, label]) => ({ label, value }));
  });
}
