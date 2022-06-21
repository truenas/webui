import { NestedTreeControl } from '@angular/cdk/tree';
import {
  Component, Input, OnInit, EventEmitter, Output, ChangeDetectorRef,
  AfterViewChecked, TrackByFunction, ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormArray, FormBuilder, FormControl, FormGroup,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-tree-nested-datasource';

export interface Filter {
  property: string;
  value: string[];
}

interface FormFilter {
  property: FormControl<string>;
  value: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  selector: 'ix-tree-search',
  templateUrl: './ix-tree-search.component.html',
  styleUrls: ['./ix-tree-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTreeSearchComponent<T> implements OnInit, AfterViewChecked {
  @Input() dataSource: IxNestedTreeDataSource<T>;
  @Input() treeControl: NestedTreeControl<T, string>;
  @Output() filter: EventEmitter<Filter[]> = new EventEmitter();
  form = this.fb.group({
    properties: [[] as string[]],
    filters: this.fb.array<FormGroup<FormFilter>>([]),
  });
  fields: string[] = [];
  fields$: Observable<Option[]>;
  options = new Map<string, string[]>();
  options$ = new Map<string, Observable<Option[]>>();
  hasLoaded = false;
  readonly trackByFilters: TrackByFunction<Filter> = (_, item) => item.property;

  fieldsProvider: ChipsProvider = () => {
    return of(this.fields);
  };

  get filters(): FormArray<FormGroup<FormFilter>> {
    return this.form.get('filters') as FormArray<FormGroup<FormFilter>>;
  }

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.form.get('properties').valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((properties: string[]) => {
      this.updateFilters(properties);
    });
  }

  ngAfterViewChecked(): void {
    if (!this.hasLoaded && this.dataSource.data.length) {
      this.buildFilterOptions(this.dataSource.data);
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

  removeFilter(index: number): void {
    this.filters.removeAt(index);
  }

  onSearch(query: string): void {
    console.info('onSearch', query);
  }

  onSubmit(): void {
    this.filter.emit(this.filters.value as unknown as Filter[]);
  }

  private buildFilterOptions(data: T[]): void {
    for (const item of data) {
      for (const property in item) {
        const value = item[property];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          if (!this.fields.includes(property)) {
            this.fields.push(property);
          }

          if (!this.options.has(property)) {
            this.options.set(property, []);
          }
          const values = this.options.get(property);
          if (!values.includes(value.toString())) {
            this.options.set(property, [...values, value.toString()]);
          }
        }
      }
    }
    this.fields$ = of(this.fields.map((property) => ({ label: property, value: property })));
    for (const [key] of this.options) {
      const options = this.options.get(key).map((value) => ({ label: value, value }));
      this.options$.set(key, of(options));
    }
  }
}
