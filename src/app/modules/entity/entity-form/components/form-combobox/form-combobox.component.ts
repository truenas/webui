import { Component, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { fromEvent, Subject } from 'rxjs';
import {
  map, takeUntil, debounceTime, distinctUntilChanged,
} from 'rxjs/operators';
import { FormComboboxConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  selector: 'ix-form-combobox',
  styleUrls: ['form-combobox.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-combobox.component.html',
})
export class FormComboboxComponent implements Field {
  config: FormComboboxConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  searchText = '';
  searchTextChanged$ = new Subject<string>();

  @ViewChild('autoComplete') autoCompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('options') menuRef: MatMenu;
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  constructor(public translate: TranslateService) {
    this.searchTextChanged$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((query) => {
      this.searchText = query;
      this.updateSearchOptions(query);
    });
  }

  search(query: string): void {
    this.searchTextChanged$.next(query);
  }

  onChangeOption(value: string | number): void {
    this.group.controls[this.config.name].setValue(value);
  }

  updateSearchOptions(value: string): void {
    if (this.config.updater && this.config.parent) {
      if (this.config.updateLocal) {
        this.config.updater(value, this.config.parent, this.config);
      } else {
        this.config.updater(value, this.config.parent);
      }
    } else {
      value = value.toLowerCase();
      this.config.searchOptions = this.config.options.filter((option) => option.label.toLowerCase().includes(value));
    }
  }

  onOpenDropdown(): void {
    setTimeout(() => {
      if (
        this.autoCompleteRef
        && this.autocompleteTrigger
        && this.autoCompleteRef.panel
      ) {
        fromEvent(this.autoCompleteRef.panel.nativeElement, 'scroll')
          .pipe(
            map(() => this.autoCompleteRef.panel.nativeElement.scrollTop),
            takeUntil(this.autocompleteTrigger.panelClosingActions),
          )
          .pipe(untilDestroyed(this)).subscribe(() => {
            const { scrollTop, scrollHeight, clientHeight: elementHeight } = this.autoCompleteRef.panel.nativeElement;
            const atBottom = scrollHeight === scrollTop + elementHeight;
            if (atBottom) {
              this.loadMoreSearchOptions();
            }
          });
      }
    });
  }

  onOpenMenu(): void {
    setTimeout(() => {
      const menuPanel = this.menuRef ? document.getElementById(this.menuRef.panelId) : undefined;
      if (menuPanel) {
        fromEvent(menuPanel, 'scroll')
          .pipe(untilDestroyed(this)).subscribe(() => {
            const scrollTop = menuPanel.scrollTop;
            const scrollHeight = menuPanel.scrollHeight;
            const elementHeight = menuPanel.clientHeight;
            const atBottom = scrollHeight === scrollTop + elementHeight;
            if (atBottom) {
              this.loadMoreOptions();
            }
          });
      }
    });
  }

  loadMoreSearchOptions(): void {
    if (this.config.loadMoreOptions && this.config.parent) {
      if (this.config.updateLocal) {
        this.config.loadMoreOptions(this.config.searchOptions.length, this.config.parent, this.searchText, this.config);
      } else {
        this.config.loadMoreOptions(this.config.searchOptions.length, this.config.parent, this.searchText);
      }
    }
  }

  loadMoreOptions(): void {
    if (this.config.loadMoreOptions && this.config.parent) {
      if (this.config.updateLocal) {
        this.config.loadMoreOptions(this.config.options.length, this.config.parent, '', this.config);
      } else {
        this.config.loadMoreOptions(this.config.options.length, this.config.parent, '');
      }
    }
  }

  hasValue(): boolean {
    return this.group.controls[this.config.name].value && this.group.controls[this.config.name].value.toString().length;
  }

  resetInput(): void {
    this.group.controls[this.config.name].setValue('');
  }
}
