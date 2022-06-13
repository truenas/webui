import { ENTER } from '@angular/cdk/keycodes';
import {
  Component, OnInit, ElementRef, ViewChild,
} from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';
import { FormChipConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  templateUrl: './form-chip.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss', './form-chip.component.scss'],
})
export class FormChipComponent implements Field, OnInit {
  config: FormChipConfig;
  group: UntypedFormGroup;
  fieldShow: string;
  chipLists: string[];
  chipCtrl = new UntypedFormControl();

  @ViewChild('chipInput') chipInput: ElementRef<HTMLInputElement>;
  @ViewChild('autoComplete') matAutocomplete: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) trigger: MatAutocompleteTrigger;

  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER];

  constructor(public translate: TranslateService) { }

  ngOnInit(): void {
    this.chipLists = this.group.controls[this.config.name].value || [];
    this.group.controls[this.config.name].valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.chipLists !== this.group.controls[this.config.name].value && typeof this.group.controls[this.config.name].value === 'object') {
        this.chipLists = this.group.controls[this.config.name].value;
      }
      this.updateSearchOptions('');
    });
  }

  paste(event: ClipboardEvent): void {
    const lineBreakValues = event.clipboardData.getData('Text').split(/\n/);
    if (lineBreakValues.length > 1) {
      event.preventDefault();
      lineBreakValues.forEach((value) => {
        if (value.trim()) {
          this.chipLists.push(value.trim());
        }
      });
      this.group.controls[this.config.name].setValue(this.chipLists);
    }
  }

  add(event: MatChipInputEvent): void {
    const input = event.chipInput.inputElement;
    const value = event.value;

    if ((value || '').trim() && !this.config.selectOnly) {
      this.chipLists.push(value.trim());
      this.group.controls[this.config.name].setValue(this.chipLists);
    }

    if (input) {
      input.value = '';
    }
  }

  remove(item: string): void {
    const index = this.chipLists.indexOf(item);

    if (index >= 0) {
      this.chipLists.splice(index, 1);
      this.group.controls[this.config.name].setValue(this.chipLists);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (this.config.selectOnly) {
      if (this.chipLists.includes(event.option.viewValue)) {
        this.chipLists = this.chipLists.filter((chip) => chip !== event.option.viewValue);
      } else {
        this.chipLists = [...new Set([...this.chipLists, event.option.viewValue])];
      }
    } else {
      this.chipLists.push(event.option.viewValue);
    }
    this.group.controls[this.config.name].setValue(this.chipLists);
    this.chipInput.nativeElement.value = '';
    this.chipCtrl.setValue(null);
    this.openPanel();
  }

  updateSearchOptions(value: string): void {
    if (this.config.updater && this.config.parent) {
      const values = this.chipLists;
      if (this.config.updateLocal) {
        this.config.updater(value, values, this.config.parent, this.config);
      } else {
        this.config.updater(value, values, this.config.parent);
      }
    } else {
      value = value.toLowerCase();
      const searchOptions: Option[] = [];
      this.config.options?.forEach((option) => {
        if (!value || option.label.toLowerCase().includes(value)) {
          searchOptions.push(option);
        }
      });
      this.config.searchOptions = searchOptions;
    }
  }

  openPanel(): void {
    if (this.config.selectOnly) {
      setTimeout(() => {
        this.trigger.openPanel();
      });
    }
  }
}
