import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FormArrayComponent } from 'app/modules/entity/entity-form/components/form-array/form-array.component';
import { FormButtonComponent } from 'app/modules/entity/entity-form/components/form-button/form-button.component';
import { FormCheckboxComponent } from 'app/modules/entity/entity-form/components/form-checkbox/form-checkbox.component';
import { FormChipComponent } from 'app/modules/entity/entity-form/components/form-chip/form-chip.component';
import { FormColorpickerComponent } from 'app/modules/entity/entity-form/components/form-colorpicker/form-colorpicker.component';
import { FormComboboxComponent } from 'app/modules/entity/entity-form/components/form-combobox/form-combobox.component';
import { FormDatepickerComponent } from 'app/modules/entity/entity-form/components/form-datepicker/form-datepicker.component';
import { FormDictComponent } from 'app/modules/entity/entity-form/components/form-dict/form-dict.component';
import { FormExplorerComponent } from 'app/modules/entity/entity-form/components/form-explorer/form-explorer.component';
import { FormInputComponent } from 'app/modules/entity/entity-form/components/form-input/form-input.component';
import { FormIpWithNetmaskComponent } from 'app/modules/entity/entity-form/components/form-ipwithnetmask/form-ipwithnetmask.component';
import { FormLabelComponent } from 'app/modules/entity/entity-form/components/form-label/form-label.component';
import { FormListComponent } from 'app/modules/entity/entity-form/components/form-list/form-list.component';
import { FormParagraphComponent } from 'app/modules/entity/entity-form/components/form-paragraph/form-paragraph.component';
import { FormPermissionsComponent } from 'app/modules/entity/entity-form/components/form-permissions/form-permissions.component';
import { FormRadioComponent } from 'app/modules/entity/entity-form/components/form-radio/form-radio.component';
import { FormReadFileComponent } from 'app/modules/entity/entity-form/components/form-readfile/form-readfile.component';
import { FormSchedulerComponent } from 'app/modules/entity/entity-form/components/form-scheduler/form-scheduler.component';
import { FormSelectComponent } from 'app/modules/entity/entity-form/components/form-select/form-select.component';
import { FormSelectionListComponent } from 'app/modules/entity/entity-form/components/form-selection-list/form-selection-list.component';
import { FormSliderComponent } from 'app/modules/entity/entity-form/components/form-slider/form-slider.component';
import { FormTaskComponent } from 'app/modules/entity/entity-form/components/form-task/form-task.component';
import { FormTextareaButtonComponent } from 'app/modules/entity/entity-form/components/form-textarea-button/form-textarea-button.component';
import { FormTextareaComponent } from 'app/modules/entity/entity-form/components/form-textarea/form-textarea.component';
import { FormToggleButtonComponent } from 'app/modules/entity/entity-form/components/form-toggle-button/form-toggle-button.component';
import { FormUploadComponent } from 'app/modules/entity/entity-form/components/form-upload/form-upload.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

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
  group: UntypedFormGroup;

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
