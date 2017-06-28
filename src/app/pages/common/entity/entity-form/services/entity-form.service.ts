import { Injectable, Inject, Optional } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, FormArray, Validators, AbstractControl } from "@angular/forms";
import { FieldConfig } from '../models/field-config.interface';
import { isDefined } from '../utils';

@Injectable()
export class EntityFormService {

    constructor(@Inject(FormBuilder) private formBuilder: FormBuilder) {}

    createFormGroup(controls: FieldConfig[]) {
    	let formGroup: { [id: string]: AbstractControl; } = {};
    	
        controls.forEach(controlModel => {
            if(controlModel.formarray) {
                if(controlModel.initialCount == null) {
                    controlModel.initialCount = 1;
                }

                let formArray = this.createFormArray(controlModel.formarray, controlModel.initialCount);
                formGroup[controlModel.name] = formArray;
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

    createFormArray(controls: FieldConfig[], initialCount: number) {
        let formArray = this.formBuilder.array([]);
        let subFormGroup = this.createFormGroup(controls);

        for(let i = 0; i < initialCount; i++) {
            formArray.push(subFormGroup);
        }
        return formArray;
    }
}