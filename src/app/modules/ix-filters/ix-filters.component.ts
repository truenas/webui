import {
  AfterViewChecked,
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, TrackByFunction,
} from '@angular/core';
import {
  FormArray, FormBuilder,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { FilterFormGroup, IxFilter } from 'app/modules/ix-filters/ix-filters.interface';

@UntilDestroy()
@Component({
  selector: 'ix-filters',
  templateUrl: './ix-filters.component.html',
  styleUrls: ['./ix-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxFiltersComponent<T> implements OnInit, AfterViewChecked {
  @Input() data: T[];
  @Output() filter = new EventEmitter<IxFilter[]>();
  form = this.fb.group({
    properties: [[] as string[]],
    filters: this.fb.array<FilterFormGroup>([]),
  });
  fields = new Map<string, string[]>();
  fields$: Observable<Option[]>;
  options$ = new Map<string, Observable<Option[]>>();
  hasLoaded = false;
  readonly trackByFn: TrackByFunction<IxFilter> = (_, item) => item.property;

  get filters(): FormArray<FilterFormGroup> {
    return this.form.get('filters') as FormArray<FilterFormGroup>;
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form.get('properties').valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((properties: string[]) => {
      this.updateFilters(properties);
    });
  }

  ngAfterViewChecked(): void {
    if (!this.hasLoaded && this.data.length) {
      this.buildFilterOptions(this.data);
      this.hasLoaded = true;
    }
  }

  updateFilters(properties: string[]): void {
    if (this.filters.value.length > properties.length) {
      this.filters.value
        .filter((filter) => !properties.includes(filter.property))
        .forEach((filter) => {
          // Remove filters when properties are unchecked
          this.filters.removeAt(this.filters.value.findIndex((input) => input.property === filter.property));
        });
    }
    properties.forEach((property) => {
      const exist = this.filters.value.find((filter) => filter.property === property);
      if (!exist) {
        this.filters.push(
          this.fb.group({
            property: [property],
            value: [[] as string[]],
          }),
        );
      }
    });
  }

  onSubmit(): void {
    this.filter.emit(this.filters.value as unknown as IxFilter[]);
  }

  private buildFilterOptions(data: T[]): void {
    for (const item of data) {
      for (const property in item) {
        const value = item[property];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          if (!this.fields.has(property)) {
            this.fields.set(property, []);
          }
          const values = this.fields.get(property);
          if (!values.includes(value.toString())) {
            this.fields.set(property, [...values, value.toString()]);
          }
        }
      }
    }
    this.fields$ = of([...this.fields.keys()].map((property) => ({ label: property, value: property })));
    for (const [key] of this.fields) {
      const options = this.fields.get(key).map((value) => ({ label: value, value }));
      this.options$.set(key, of(options));
    }
  }
}
