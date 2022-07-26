import { ElementRef } from '@angular/core';
import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSelectionListChange } from '@angular/material/list';
import { MatRadioChange } from '@angular/material/radio';
import { MatSelectChange } from '@angular/material/select';
import { ITreeOptions } from '@circlon/angular-tree-component';
import { DatasetType } from 'app/enums/dataset.enum';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { Option } from 'app/interfaces/option.interface';
import { FieldType } from 'app/modules/entity/entity-form/components/dynamic-field/dynamic-field.directive';
import { FormExplorerComponent } from 'app/modules/entity/entity-form/components/form-explorer/form-explorer.component';
import { FormUploadComponent } from 'app/modules/entity/entity-form/components/form-upload/form-upload.component';
import { RelationGroup } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { FormSelectOption } from 'app/modules/entity/entity-form/models/form-select-option.interface';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';

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

export interface BaseFieldConfig<P> {
  asyncValidation?: AsyncValidatorFn | AsyncValidatorFn[];
  class?: string;
  disabled?: boolean;
  errors?: string;
  hasErrors?: boolean;
  hideErrMsg?: boolean;
  id?: string;
  isHidden?: boolean;
  name: string;
  /**
   * @deprecated Capture parent with an arrow function instead.
   */
  parent?: P;
  placeholder?: string;
  readonly?: boolean;
  relation?: RelationGroup[];
  required?: boolean;
  tooltip?: string;
  tooltipPosition?: string;
  type: FieldType;
  validation?: ValidatorFn | ValidatorFn[];
  value?: any;
  warnings?: string;
  width?: string;
}

export interface FormLabelConfig<P = unknown> extends BaseFieldConfig<P> {
  label: string;
  type: 'label';
}

export interface FormArrayConfig<P = unknown> extends BaseFieldConfig<P> {
  formarray?: FieldConfig[];
  initialCount?: number;
  type: 'array';
}

export interface FormButtonConfig<P = unknown> extends BaseFieldConfig<P> {
  buttonClass?: string;
  buttonColor?: string;
  customEventActionLabel?: string;
  customEventMethod?: (event: MouseEvent) => void;
  type: 'button';
}

export interface FormCheckboxConfig<P = unknown> extends BaseFieldConfig<P> {
  expandedHeight?: boolean;
  onChange?(data: { event: MatCheckboxChange }): void;
  type: 'checkbox';
  inlineLabel?: boolean;
  updater?: (parent: P) => void;
  customEventMethod?: () => void;
}

export interface FormChipConfig<P = unknown> extends BaseFieldConfig<P> {
  autocomplete?: boolean;
  options?: Option[];
  searchOptions?: Option[];
  type: 'chip';
  updateLocal?: boolean;
  updater?: (value: string, values: string[], parent: P, config?: FormChipConfig) => void;
  togglePw?: boolean;
  selectOnly?: boolean;
}

export interface FormComboboxConfig<P = unknown> extends BaseFieldConfig<P> {
  enableTextWrapForOptions?: boolean;
  inlineFields?: boolean;
  inlineFieldFlex?: string;
  loadMoreOptions?: (length: number, parent: P, searchText: string, config?: FormComboboxConfig) => void;
  options?: FormComboboxOption[];
  searchable?: boolean;
  searchOptions?: FormComboboxOption[];
  type: 'combobox';
  updateLocal?: boolean;
  updater?: (value: string, parent: P, config?: FormComboboxConfig) => void;
  inputType?: string;
}

export interface FormComboboxOption {
  label: string;
  value: string | number;
  sticky?: string;
}

export interface FormDictConfig<P = unknown> extends BaseFieldConfig<P> {
  label?: string;
  subFields?: FieldConfig[];
  type: 'dict';
}

export interface FormExplorerConfig<P = unknown> extends BaseFieldConfig<P> {
  customTemplateStringOptions?: ITreeOptions & {
    explorerComponent?: FormExplorerComponent;
    explorer?: FormExplorerComponent;
  };
  explorerParam?: [DatasetType[]?];
  explorerType?: ExplorerType;
  fileLocation?: string;
  initial?: string;
  multiple?: boolean;
  rootSelectable?: boolean;
  tristate?: boolean;
  type: 'explorer';
}

export interface FormInputConfig<P = unknown> extends BaseFieldConfig<P> {
  blurEvent?: () => void;
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
  type: 'input';
}

export interface FormIpWithNetmaskConfig<P = unknown> extends BaseFieldConfig<P> {
  netmaskPreset?: number;
  inputType?: string;
  togglePw?: boolean;
  type: 'ipwithnetmask';
}

export interface FormListConfig<P = unknown> extends BaseFieldConfig<P> {
  addInitialList?: boolean;
  box?: boolean;
  label?: string;
  listFields?: FieldConfig[][];
  templateListField?: FieldConfig[];
  hideButton?: boolean;
  type: 'list';
}

export interface FormParagraphConfig<P = unknown> extends BaseFieldConfig<P> {
  isLargeText?: boolean;
  paragraphIcon?: string;
  paragraphIconSize?: string;
  paraText?: string;
  inputType?: string;
  type: 'paragraph';
}

export interface FormPermissionsConfig<P = unknown> extends BaseFieldConfig<P> {
  hideOthersPermissions?: boolean;
  inputType?: string;
  options?: Option[];
  type: 'permissions';
}

export interface FormRadioConfig<P = unknown> extends BaseFieldConfig<P>{
  inlineFields?: boolean;
  inlineFieldFlex?: string;
  onChange?(data: { event: MatRadioChange }): void;
  options?: FormRadioOption[];
  type: 'radio';
}

export interface FormRadioOption {
  label: string;
  value: any;
  hiddenFromDisplay?: boolean;
  tooltip?: string;
}

export interface FormSchedulerConfig<P = unknown> extends BaseFieldConfig<P> {
  options?: [startTime: string, endTime: string];
  noMinutes?: boolean;
  type: 'scheduler';
}

export interface FormSelectConfig<P = unknown> extends BaseFieldConfig<P> {
  enableTextWrapForOptions?: boolean;
  fileLocation?: string;
  inlineLabel?: string;
  linkText?: string;
  linkClicked?(): void;
  isLoading?: boolean;
  multiple?: boolean;
  onChangeOption?(data: { event: MatSelectChange }): void;
  options?: FormSelectOption[];
  zeroStateMessage?: string;
  type: 'select';
}

export interface FormSelectionListConfig<P = unknown> extends BaseFieldConfig<P> {
  hint?: string;
  inlineFields?: boolean;
  inlineFieldFlex?: string;
  onChange?(event: MatSelectionListChange): void;
  options?: FormSelectionOption[];
  type: 'selectionlist';
}

export interface FormSelectionOption extends Option {
  tooltip?: string;
}

export interface FormSliderConfig<P = unknown> extends BaseFieldConfig<P> {
  max?: number;
  min?: number;
  type: 'slider';
}

export interface FormTaskConfig<P = unknown> extends BaseFieldConfig<P> {
  tabs?: (FieldConfig & { tabName: string })[];
  tabName?: string;
  type: 'task';
}

export interface FormTextareaConfig<P = unknown> extends BaseFieldConfig<P> {
  blurEvent?: () => void;
  blurStatus?: boolean;
  filereader?: boolean;
  fileType?: string;
  textAreaRows?: number;
  type: 'textarea';
}

export interface FormTextareaButtonConfig<P = unknown> extends BaseFieldConfig<P> {
  customEventActionLabel?: string;
  customEventMethod?(data?: { event: MouseEvent; textAreaSSH: ElementRef }): void;
  type: 'textareabutton';
}

export interface FormUploadConfig<P = unknown> extends BaseFieldConfig<P> {
  acceptedFiles?: string;
  fileLocation?: string;
  hideButton?: boolean;
  message?: MessageService;
  rootSelectable?: boolean;
  updater?: (uploadComponent: FormUploadComponent, parent: P) => void;
  multiple?: boolean;
  type: 'upload';
}

export interface FormToggleButtonConfig<P = unknown> extends BaseFieldConfig<P> {
  options?: FormToggleButtonOption[];
  type: 'togglebutton';
}

export interface FormToggleButtonOption {
  label: string;
  value: any;
  checked?: boolean;
}

export interface FormColorPickerConfig<P = unknown> extends BaseFieldConfig<P> {
  type: 'colorpicker';
}

export interface FormReadFileConfig<P = unknown> extends BaseFieldConfig<P> {
  type: 'readfile';
}

/**
 * @deprecated Do not use. Not a real FieldConfig.
 * Instead, this is an exception for iscsi initiators and is used in one place.
 */
export interface FormInputListConfig<P = unknown> extends BaseFieldConfig<P> {
  type: 'input-list';
  customEventMethod: (parent: any) => void;
}

export type FieldConfig<P = unknown> =
| FormLabelConfig<P>
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
| FormUploadConfig<P>
| FormTextareaButtonConfig<P>
| FormColorPickerConfig<P>
| FormReadFileConfig<P>
| FormInputListConfig<P>;
