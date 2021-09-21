import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { MatRadioChange } from '@angular/material/radio/radio';
import { ITreeOptions } from 'angular-tree-component';
import { Option } from 'app/interfaces/option.interface';
import { FieldType } from 'app/pages/common/entity/entity-form/components/dynamic-field/dynamic-field.directive';
import { FormExplorerComponent } from 'app/pages/common/entity/entity-form/components/form-explorer/form-explorer.component';
import { FormUploadComponent } from 'app/pages/common/entity/entity-form/components/form-upload/form-upload.component';
import { FormSelectOption } from 'app/pages/common/entity/entity-form/models/form-select-option.interface';
import { RelationGroup } from './field-relation.interface';

export enum UnitType {
  Duration = 'duration',
  Size = 'size',
}

export interface InputUnitConfig {
  type: UnitType;
  decimal?: boolean;
  default?: string;
  allowUnits?: string[];
}

export interface BaseFieldConfig<P = any> {
  asyncValidation?: AsyncValidatorFn | AsyncValidatorFn[];
  class?: string;
  disabled?: boolean;
  errors?: string;
  hasErrors?: boolean;
  hideErrMsg?: boolean;
  id?: string;
  isHidden?: boolean;
  name: string;
  parent?: P;
  placeholder?: string;
  readonly?: boolean;
  relation?: RelationGroup[];
  required?: boolean;
  tooltip?: string;
  tooltipPosition?: string;
  type: FieldType;
  validation?: any[] | ValidatorFn | ValidatorFn[];
  value?: any;
  warnings?: string;
  width?: string;
}

export interface FormArrayConfig<P = any> extends BaseFieldConfig<P> {
  formarray?: FieldConfig[];
  initialCount?: number;
}

export interface FormButtonConfig<P = any> extends BaseFieldConfig<P> {
  buttonClass: string;
  buttonColor: string;
  customEventActionLabel?: string;
  customEventMethod?: (event: any) => void;
}

export interface FormCheckboxConfig<P = any> extends BaseFieldConfig<P> {
  expandedHeight?: boolean;
  onChange?(data: { event: MatCheckboxChange }): void;
  updater?: (parent: P) => void;
  customEventMethod?: () => void;
}

export interface FormChipConfig<P = any> extends BaseFieldConfig<P> {
  autocomplete?: boolean;
  options?: any[];
  searchOptions?: Option[];
  updateLocal?: boolean;
  updater?: (value: any, parent: P, config?: FormChipConfig) => void;
  togglePw?: boolean;
}

export interface FormComboboxConfig<P = any> extends BaseFieldConfig<P> {
  enableTextWrapForOptions?: boolean;
  inlineFields?: boolean;
  inlineFieldFlex?: string;
  loadMoreOptions?: (length: number, parent: P, searchText: string, config?: FormComboboxConfig) => void;
  options?: FormComboboxOption[];
  searchable?: boolean;
  searchOptions?: FormComboboxOption[];
  updateLocal?: boolean;
  updater?: (value: string, parent: P, config?: FormComboboxConfig) => void;
  inputType?: string;
}

export interface FormComboboxOption {
  label: string;
  value: string | number;
  sticky?: string;
}

export interface FormDictConfig<P = any> extends BaseFieldConfig<P> {
  label?: string;
  subFields?: FieldConfig[];
}

export interface FormExplorerConfig<P = any> extends BaseFieldConfig<P> {
  customTemplateStringOptions?: ITreeOptions & {
    explorerComponent?: FormExplorerComponent;
    explorer?: FormExplorerComponent;
  };
  explorerParam?: any;
  explorerType?: string;
  fileLocation?: string;
  hideDirs?: string;
  initial?: string;
  multiple?: boolean;
  rootSelectable?: boolean;
  tristate?: boolean;
}

export interface FormInputConfig<P = any> extends BaseFieldConfig<P> {
  blurEvent?: (parent: P) => void;
  blurStatus?: boolean;
  fileType?: string;
  hideButton?: boolean;
  hint?: string;
  inputType?: string;
  inputUnit?: InputUnitConfig;
  isLoading?: boolean;
  isDoubleConfirm?: boolean;
  label?: string;
  maskValue?: string;
  max?: number;
  min?: number;
  searchable?: boolean;
  togglePw?: boolean;
}

export interface FormIpWithNetmaskConfig<P = any> extends BaseFieldConfig<P> {
  netmaskPreset?: number;
  inputType?: string;
  togglePw?: boolean;
}

export interface FormListConfig<P = any> extends BaseFieldConfig<P> {
  addInitialList?: boolean;
  box?: boolean;
  label?: string;
  listFields?: FieldConfig[][];
  templateListField?: FieldConfig[];
  hideButton?: boolean;
}

export interface FormParagraphConfig<P = any> extends BaseFieldConfig<P> {
  isLargeText?: boolean;
  paragraphIcon?: string;
  paragraphIconSize?: string;
  paraText?: string;
  inputType?: string;
}

export interface FormPermissionsConfig<P = any> extends BaseFieldConfig<P> {
  hideOthersPermissions?: boolean;
  inputType?: string;
  options?: Option[];
}

export interface FormRadioConfig<P = any> extends BaseFieldConfig<P>{
  inlineFields?: boolean;
  inlineFieldFlex?: string;
  onChange?(data: { event: MatRadioChange }): void;
  options?: FormRadioOption[];
}

export interface FormRadioOption {
  label: string;
  value: any;
  hiddenFromDisplay?: boolean;
  tooltip?: string;
}

export interface FormSchedulerConfig<P = any> extends BaseFieldConfig<P> {
  options?: any[];
  noMinutes?: boolean;
  onChangeOption?(data: any): void;
}

export interface FormSelectConfig<P = any> extends BaseFieldConfig<P> {
  alert?: { message: string; forValues: any[] };
  enableTextWrapForOptions?: boolean;
  fileLocation?: string;
  inlineLabel?: string;
  isLoading?: boolean;
  multiple?: boolean;
  onChangeOption?(data: any): void;
  options?: FormSelectOption[];
  zeroStateMessage?: string;
}

export interface FormSelectionListConfig<P = any> extends BaseFieldConfig<P> {
  hint?: string;
  inlineFields?: boolean;
  inlineFieldFlex?: string;
  onChange?(data: any): void;
  options?: Option[];
}

export interface FormSliderConfig<P = any> extends BaseFieldConfig<P> {
  max?: number;
  min?: number;
}

export interface FormTaskConfig<P = any> extends BaseFieldConfig<P> {
  tabs?: FieldConfig[];
  tabName?: string;
}

export interface FormTextareaConfig<P = any> extends BaseFieldConfig<P> {
  blurEvent?: (parent: P) => void;
  blurStatus?: boolean;
  filereader?: boolean;
  fileType: string;
  textAreaRows?: number;
}

export interface FormTextareaButtonConfig<P = any> extends BaseFieldConfig<P> {
  customEventActionLabel?: string;
  customEventMethod?(data?: any): void;
}

export interface FormUploadConfig<P = any> extends BaseFieldConfig<P> {
  acceptedFiles?: string;
  fileLocation?: string;
  hideButton?: boolean;
  message?: any;
  rootSelectable?: boolean;
  updater?: (uploadComponent: FormUploadComponent, parent: P) => void;
  multiple?: boolean;
}

export interface FormToggleButtonConfig<P = any> extends BaseFieldConfig<P> {
  options?: FormToggleButtonOption[];
}

export interface FormToggleButtonOption {
  label: string;
  value: any;
  checked?: boolean;
}

export type FieldConfig<P = any> = BaseFieldConfig<P>
| FormArrayConfig<P>
| FormButtonConfig<P>
| FormCheckboxConfig<P>
| FormChipConfig<P>
| FormComboboxConfig<P>
| FormDictConfig<P>
| FormExplorerConfig<P>
| FormInputConfig<P>
| FormIpWithNetmaskConfig<P>
| FormListConfig<P>
| FormParagraphConfig<P>
| FormPermissionsConfig<P>
| FormRadioConfig<P>
| FormSchedulerConfig<P>
| FormSelectConfig<P>
| FormSelectionListConfig<P>
| FormSliderConfig<P>
| FormTaskConfig<P>
| FormTextareaConfig<P>
| FormToggleButtonConfig<P>
| FormUploadConfig<P>;
