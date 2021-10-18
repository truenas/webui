import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { Choices } from 'app/interfaces/choices.interface';
import { Option } from 'app/interfaces/option.interface';

export function mapToOptions(map: Map<string, string>): Option[] {
  return Array.from(map.entries()).map(([value, label]) => ({ label, value }));
}

export function choicesToOptions(): OperatorFunction<Choices, Option[]> {
  return map((choices) => {
    return Object.entries(choices).map(([value, label]) => ({ label, value }));
  });
}
