import { Component, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { fromEvent } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  selector: 'form-combobox',
  styleUrls: ['form-combobox.component.scss', '../dynamic-field/dynamic-field.scss'],
  templateUrl: './form-combobox.component.html',
})
export class FormComboboxComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
  searchText: string;

  @ViewChild('autoComplete') autoCompleteRef: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('options') menuRef: MatMenu;
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  constructor(public translate: TranslateService) {}

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
      const searchOptions: Option[] = [];
      for (let i = 0; i < this.config.options.length; i++) {
        if (this.config.options[i].label.toLowerCase().includes(value)) {
          searchOptions.push(this.config.options[i]);
        }
      }
      this.config.searchOptions = searchOptions;
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
