import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormSelectionListComponent } from 'app/pages/common/entity/entity-form/components/form-selection-list/form-selection-list.component';
import { FormTextareaButtonComponent } from 'app/pages/common/entity/entity-form/components/form-textarea-button/form-textarea-button.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';
import { FormArrayComponent } from '../form-array/form-array.component';
import { FormButtonComponent } from '../form-button/form-button.component';
import { FormCheckboxComponent } from '../form-checkbox/form-checkbox.component';
import { FormChipComponent } from '../form-chip/form-chip.component';
import { FormColorpickerComponent } from '../form-colorpicker/form-colorpicker.component';
import { FormComboboxComponent } from '../form-combobox/form-combobox.component';
import { FormDatepickerComponent } from '../form-datepicker/form-datepicker.component';
import { FormDictComponent } from '../form-dict/form-dict.component';
import { FormExplorerComponent } from '../form-explorer/form-explorer.component';
import { FormInputComponent } from '../form-input/form-input.component';
import { FormIpWithNetmaskComponent } from '../form-ipwithnetmask/form-ipwithnetmask.component';
import { FormLabelComponent } from '../form-label/form-label.component';
import { FormListComponent } from '../form-list/form-list.component';
import { FormParagraphComponent } from '../form-paragraph/form-paragraph.component';
import { FormPermissionsComponent } from '../form-permissions/form-permissions.component';
import { FormRadioComponent } from '../form-radio/form-radio.component';
import { FormReadFileComponent } from '../form-readfile/form-readfile.component';
import { FormSchedulerComponent } from '../form-scheduler/form-scheduler.component';
import { FormSelectComponent } from '../form-select/form-select.component';
import { FormSliderComponent } from '../form-slider/form-slider.component';
import { FormTaskComponent } from '../form-task/form-task.component';
import { FormTextareaComponent } from '../form-textarea/form-textarea.component';
import { FormToggleButtonComponent } from '../form-toggle-button/form-toggle-button.component';
import { FormUploadComponent } from '../form-upload/form-upload.component';

const components = {
  button: FormButtonComponent,
  input: FormInputComponent,
  label: FormLabelComponent,
  select: FormSelectComponent,
  checkbox: FormCheckboxComponent,
  textarea: FormTextareaComponent,
  textareabutton: FormTextareaButtonComponent,
  permissions: FormPermissionsComponent,
  array: FormArrayComponent,
  upload: FormUploadComponent,
  explorer: FormExplorerComponent,
  radio: FormRadioComponent,
  selectionlist: FormSelectionListComponent,
  slider: FormSliderComponent,
  togglebutton: FormToggleButtonComponent,
  task: FormTaskComponent,
  readfile: FormReadFileComponent,
  datepicker: FormDatepickerComponent,
  colorpicker: FormColorpickerComponent,
  combobox: FormComboboxComponent,
  paragraph: FormParagraphComponent,
  scheduler: FormSchedulerComponent,
  ipwithnetmask: FormIpWithNetmaskComponent,
  list: FormListComponent,
  chip: FormChipComponent,
  dict: FormDictComponent,
};

// TODO: Check if 'input-list' is properly supported.
export type FieldType = keyof typeof components | 'input-list';

@Directive({ selector: '[dynamicField]' })
export class DynamicFieldDirective implements Field, OnChanges, OnInit {
  @Input()
  config: FieldConfig;

  @Input()
  group: FormGroup;

  @Input()
  fieldShow: string;

  component: ComponentRef<Field>;

  constructor(private resolver: ComponentFactoryResolver,
    private container: ViewContainerRef) {}

  ngOnChanges(): void {
    if (this.component) {
      this.component.instance.config = this.config;
      this.component.instance.group = this.group;
      this.component.instance.fieldShow = this.fieldShow;
    }
  }

  ngOnInit(): void {
    if (!components[this.config.type as keyof typeof components]) {
      const supportedTypes = Object.keys(components).join(', ');
      throw new Error(`Trying to use an unsupported type (${this.config.type}).
        Supported types: ${supportedTypes}`);
    }
    const component = this.resolver.resolveComponentFactory<Field>(
      components[this.config.type as keyof typeof components],
    );
    this.component = this.container.createComponent(component);
    this.component.instance.config = this.config;
    this.component.instance.group = this.group;
    this.component.instance.fieldShow = this.fieldShow;
  }
}
