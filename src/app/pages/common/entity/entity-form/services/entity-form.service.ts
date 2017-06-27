import { Injectable, Inject, Optional } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl } from "@angular/forms";
import { FieldConfig } from '../models/field-config.interface';
import { isDefined } from '../utils';

@Injectable()
export class EntityFormService {

    constructor(@Inject(FormBuilder) private formBuilder: FormBuilder) {}

    createFormGroup(controls: FieldConfig[]) {
    	let formGroup: { [id: string]: AbstractControl; } = {};
    	
        controls.forEach(controlModel => {
            if(controlModel.formarray) {
                let subFormGroup = this.createFormGroup(controlModel.formarray);
                formGroup[controlModel.name] = subFormGroup;
            } else {
                formGroup[controlModel.name] = new FormControl(
                    {
                        value: controlModel.value,
                        disabled: controlModel.disabled
                    },
                    controlModel.validation
                );
            }

            controlModel.relation = Array.isArray(controlModel.relation) ? controlModel.relation : [];
        });
    	
        return this.formBuilder.group(formGroup);
    }
}