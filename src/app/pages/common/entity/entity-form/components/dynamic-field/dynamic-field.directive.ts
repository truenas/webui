import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnInit,
  Type,
  ViewContainerRef
} from '@angular/core';
import {FormGroup} from '@angular/forms';

import {FieldConfig} from '../../models/field-config.interface';
import {Field} from '../../models/field.interface';
import {FormArrayComponent} from '../form-array/form-array.component';
import {FormButtonComponent} from '../form-button/form-button.component';
import {FormCheckboxComponent} from '../form-checkbox/form-checkbox.component';
import {FormInputComponent} from '../form-input/form-input.component';
import {FormPermissionsComponent} from '../form-permissions/form-permissions.component';
import {FormSelectComponent} from '../form-select/form-select.component';
import {FormTextareaComponent} from '../form-textarea/form-textarea.component';
import {FormUploadComponent} from '../form-upload/form-upload.component';
import {FormExplorerComponent} from '../form-explorer/form-explorer.component';
import {FormRadioComponent} from '../form-radio/form-radio.component';
import {FormSliderComponent} from '../form-slider/form-slider.component';
import {FormToggleButtonComponent} from '../form-toggle-button/form-toggle-button.component';
import {FormTaskComponent} from '../form-task/form-task.component';
import {FormReadFileComponent} from '../form-readfile/form-readfile.component'
import { FormTextareaButtonComponent } from 'app/pages/common/entity/entity-form/components/form-textarea-button/form-textarea-button.component';
import { FormDatepickerComponent } from '../form-datepicker/form-datepicker.component';
import { FormColorpickerComponent } from '../form-colorpicker/form-colorpicker.component';
import { FormComboboxComponent } from '../form-combobox/form-combobox.component';
import {FormParagraphComponent} from '../form-paragraph/form-paragraph.component';

const components: {[type: string] : Type<Field>} = {
  button : FormButtonComponent,
  input : FormInputComponent,
  select : FormSelectComponent,
  checkbox : FormCheckboxComponent,
  textarea : FormTextareaComponent,
  textareabutton: FormTextareaButtonComponent,
  permissions : FormPermissionsComponent,
  array : FormArrayComponent,
  upload : FormUploadComponent,
  explorer: FormExplorerComponent,
  radio: FormRadioComponent,
  slider: FormSliderComponent,
  togglebutton: FormToggleButtonComponent,
  task: FormTaskComponent,
  readfile: FormReadFileComponent,
  datepicker: FormDatepickerComponent,
  colorpicker: FormColorpickerComponent,
  combobox: FormComboboxComponent,
  paragraph: FormParagraphComponent
};

@Directive({selector : '[dynamicField]'})
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

  ngOnChanges() {
    if (this.component) {
      this.component.instance.config = this.config;
      this.component.instance.group = this.group;
      this.component.instance.fieldShow = this.fieldShow;
    }
  }

  ngOnInit() {
    if (!components[this.config.type]) {
      const supportedTypes = Object.keys(components).join(', ');
      throw new Error(`Trying to use an unsupported type (${this.config.type}).
        Supported types: ${supportedTypes}`);
    }
    const component = this.resolver.resolveComponentFactory<Field>(components[this.config.type]);
    this.component = this.container.createComponent(component);
    this.component.instance.config = this.config;
    this.component.instance.group = this.group;
    this.component.instance.fieldShow = this.fieldShow;
  }
}
