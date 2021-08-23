import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Option } from 'app/interfaces/option.interface';
import { FieldType } from 'app/pages/common/entity/entity-form/components/dynamic-field/dynamic-field.directive';
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
  addBtnMessage?: string;
  addInitialList?: boolean;
  alert?: { message: string; forValues: any[] };
  asyncValidation?: AsyncValidatorFn | AsyncValidatorFn[];
  autocomplete?: boolean;
  blurEvent?: (parent: P) => void;
  blurStatus?: boolean;
  box?: boolean;
  buttonClass?: string;
  buttonColor?: string;
  class?: string;
  customEventActionLabel?: string;
  customTemplateStringOptions?: any;
  deleteButtonOnFirst?: boolean;
  disabled?: boolean;
  enableTextWrapForOptions?: boolean;
  errors?: string;
  expandedHeight?: boolean;
  fileType?: string;
  filereader?: boolean;
  fileLocation?: string;
  formarray?: any;
  hasErrors?: boolean;
  hideButton?: boolean;
  hideDirs?: string;
  hideErrMsg?: boolean;
  hideOthersPermissions?: boolean;
  hint?: string;
  id?: string;
  initial?: string;
  initialCount?: number;
  inlineLabel?: string;
  inlineFields?: boolean;
  inlineFieldFlex?: string;
  inputType?: string;
  inputUnit?: InputUnitConfig;
  isDoubleConfirm?: boolean;
  isHidden?: boolean;
  isLargeText?: boolean;
  isLoading?: boolean;
  label?: string;
  listFields?: FieldConfig[][];
  loadMoreOptions?: any;
  maskValue?: any;
  max?: number;
  message?: any;
  min?: number;
  multiple?: boolean;
  name: string;
  netmaskPreset?: number;
  noMinutes?: boolean;
  options?: any[];
  paraText?: any;
  paragraphIcon?: string;
  paragraphIconSize?: string;
  parent?: P;
  placeholder?: string;
  readonly?: boolean;
  relation?: RelationGroup[];
  required?: boolean;
  rootSelectable?: boolean;
  searchOptions?: Option[];
  searchable?: boolean;
  subFields?: FieldConfig[];
  tabName?: string;
  tabs?: any[];
  templateListField?: FieldConfig[];
  textAreaRows?: number;
  togglePw?: boolean;
  tooltip?: string;
  tooltipPosition?: string;
  tristate?: boolean;
  type: FieldType;
  updateLocal?: boolean;
  updater?: any;
  validation?: any[] | ValidatorFn | ValidatorFn[];
  value?: any;
  warnings?: string;
  width?: string;
  zeroStateMessage?: string;

  customEventMethod?(data: any): void;
  onChange?(data: any): void;
  onChangeOption?(data: any): void;
}

export interface FormUploadConfig<P = any> extends BaseFieldConfig<P> {
  acceptedFiles?: string;
}

export interface FormExplorerConfig<P = any> extends BaseFieldConfig<P> {
  explorerParam?: any;
  explorerType?: string;
  // fileLocation?: string;
}

export type FieldConfig<P = any> = BaseFieldConfig<P> | FormUploadConfig<P> | FormExplorerConfig<P>;
