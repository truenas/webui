import { inject } from '@angular/core';
import {
  format, subDays, subMonths, subWeeks,
} from 'date-fns';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { PropertyType, SearchProperty } from 'app/modules/search-input/types/search-property.interface';

export function searchProperties<T>(properties: SearchProperty<T>[]): SearchProperty<T>[] {
  return properties;
}

export function textProperty<T>(
  property: keyof T,
  label: string,
  valueSuggestions$?: Observable<Option[]>,
): SearchProperty<T> {
  return {
    label,
    property,
    valueSuggestions$,
    propertyType: PropertyType.Text,
  };
}

export function dateProperty<T>(
  property: keyof T,
  label: string,
): SearchProperty<T> {
  return {
    label,
    property,
    propertyType: PropertyType.Date,
    valueSuggestions$:
      of([
        {
          label: 'Today',
          value: `"${format(new Date(), 'yyyy-MM-dd')}"`,
        },
        {
          label: 'Yesterday',
          value: `"${format(subDays(new Date(), 1), 'yyyy-MM-dd')}"`,
        },
        {
          label: 'Last week',
          value: `"${format(subWeeks(new Date(), 1), 'yyyy-MM-dd')}"`,
        },
        {
          label: 'Last month',
          value: `"${format(subMonths(new Date(), 1), 'yyyy-MM-dd')}"`,
        },
      ]),
  };
}

export function booleanProperty<T>(
  property: keyof T,
  label: string,
): SearchProperty<T> {
  return {
    label,
    property,
    propertyType: PropertyType.Boolean,
  };
}

export function memoryProperty<T>(property: keyof T, label: string): SearchProperty<T> {
  // TODO: Is this better or worse than making all of this a service?
  const formatter = inject(IxFormatterService);

  return {
    label,
    property,
    formatValue: (value) => formatter.memorySizeFormatting(value as string),
    parseValue: (value) => formatter.memorySizeParsing(value),
    propertyType: PropertyType.Memory,
  };
}
