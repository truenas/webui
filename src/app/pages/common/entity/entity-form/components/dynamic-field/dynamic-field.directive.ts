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

const components: {[type: string] : Type<Field>} = {
  button : FormButtonComponent,
  input : FormInputComponent,
  select : FormSelectComponent,
  checkbox : FormCheckboxComponent,
  textarea : FormTextareaComponent,
  permissions : FormPermissionsComponent,
  array : FormArrayComponent,
  upload : FormUploadComponent,
  explorer: FormExplorerComponent,
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
