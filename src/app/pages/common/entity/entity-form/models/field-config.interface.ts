import { ValidatorFn } from '@angular/forms';
import { RelationGroup } from './field-relation.interface';

export interface FieldConfig {
  disabled?: boolean, label?: string, name: string, options?: any[],
  errors?: string, hasErrors?: boolean, placeholder?: string, type: string,
  inputType?: string, validation?: any[] | ValidatorFn | ValidatorFn[],
  value?: any, multiple?: boolean, tooltip?: string,
  relation?: RelationGroup[], isHidden?: boolean, formarray?: any,
  initialCount?: number, readonly?: boolean, initial?: string,
  min?: number, max?: number, tabs?: any[], tabName?: string, class?: string,
  customEventActionLabel?: string, explorerType?: string, customTemplateStringOptions?: any,
  required?: boolean,
  acceptedFiles?: string, fileLocation?: string, fileType?: string,width?:string, 
  message?: any, updater?:any, parent?:any,togglePw?:boolean, paraText?: any,
  noexec?: boolean, blurStatus?:boolean,blurEvent?:any,noMinutes?:boolean,
  warnings?: string, hideButton?:boolean, searchOptions?: any[], hideDirs?: any,
  listFields?: Array<FieldConfig>[], templateListField?: FieldConfig[],
  updateLocal?: boolean
  customEventMethod?(data:any), onChangeOption?(data:any), 
  
}
