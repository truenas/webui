import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  format, subDays, subMonths, subWeeks,
} from 'date-fns';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { PropertyType, SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';

export function searchProperties<T>(properties: SearchProperty<T>[]): SearchProperty<T>[] {
  return properties;
}

export function textProperty<T>(
  property: keyof T | string,
  label: string,
  valueSuggestions$?: Observable<Option[]>,
  enumMap?: Map<unknown, string>,
): SearchProperty<T> {
  return {
    label,
    property,
    valueSuggestions$,
    enumMap,
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
        { label: T('Today'), value: `"${format(new Date(), 'yyyy-MM-dd')}"` },
        { label: T('Yesterday'), value: `"${format(subDays(new Date(), 1), 'yyyy-MM-dd')}"` },
        { label: T('2 days ago'), value: `"${format(subDays(new Date(), 2), 'yyyy-MM-dd')}"` },
        { label: T('3 days ago'), value: `"${format(subDays(new Date(), 3), 'yyyy-MM-dd')}"` },
        { label: T('4 days ago'), value: `"${format(subDays(new Date(), 4), 'yyyy-MM-dd')}"` },
        { label: T('5 days ago'), value: `"${format(subDays(new Date(), 5), 'yyyy-MM-dd')}"` },
        { label: T('Last week'), value: `"${format(subWeeks(new Date(), 1), 'yyyy-MM-dd')}"` },
        { label: T('2 weeks ago'), value: `"${format(subWeeks(new Date(), 2), 'yyyy-MM-dd')}"` },
        { label: T('3 weeks ago'), value: `"${format(subWeeks(new Date(), 3), 'yyyy-MM-dd')}"` },
        { label: T('Last month'), value: `"${format(subMonths(new Date(), 1), 'yyyy-MM-dd')}"` },
        { label: T('2 months ago'), value: `"${format(subMonths(new Date(), 2), 'yyyy-MM-dd')}"` },
        { label: T('3 months ago'), value: `"${format(subMonths(new Date(), 3), 'yyyy-MM-dd')}"` },
        { label: T('4 months ago'), value: `"${format(subMonths(new Date(), 4), 'yyyy-MM-dd')}"` },
        { label: T('5 months ago'), value: `"${format(subMonths(new Date(), 5), 'yyyy-MM-dd')}"` },
        { label: T('6 months ago'), value: `"${format(subMonths(new Date(), 6), 'yyyy-MM-dd')}"` },
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
    valueSuggestions$: of([
      { label: T('Yes'), value: 'true' },
      { label: T('No'), value: 'false' },
    ]),
  };
}

export function memoryProperty<T>(property: keyof T, label: string, formatter: IxFormatterService): SearchProperty<T> {
  return {
    label,
    property,
    formatValue: (value) => formatter.memorySizeFormatting(value as string),
    parseValue: (value) => formatter.memorySizeParsing(value),
    propertyType: PropertyType.Memory,
  };
}
