import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';

import * as _ from 'lodash';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { fromEvent, Subscription } from 'rxjs';
import {
  map, takeUntil, debounceTime, distinctUntilChanged, mergeMap,
} from 'rxjs/operators';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { Subject } from 'rxjs';

@Component({
  selector: 'form-combobox',
  styleUrls: ['form-combobox.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-combobox.component.html',
})
export class FormComboboxComponent implements Field, OnDestroy {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  searchText = '';
  searchTextChanged = new Subject<string>();
  searchSubscription: Subscription;

  @ViewChild('autoComplete') autoCompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('options') menuRef: MatMenu;
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  constructor(public translate: TranslateService) {
    this.searchSubscription = this.searchTextChanged.pipe(
      debounceTime(250),
      distinctUntilChanged(),
    ).subscribe((query) => {
      this.searchText = query;
      this.updateSearchOptions(query);
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  search(query: string): void {
    this.searchTextChanged.next(query);
  }

  onChangeOption(value: any): void {
    this.group.controls[this.config.name].setValue(value);
  }

  updateSearchOptions(value: any): void {
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
          .subscribe(() => {
            const scrollTop = this.autoCompleteRef.panel.nativeElement
              .scrollTop;
            const scrollHeight = this.autoCompleteRef.panel.nativeElement
              .scrollHeight;
            const elementHeight = this.autoCompleteRef.panel.nativeElement
              .clientHeight;
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
          .subscribe(() => {
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
