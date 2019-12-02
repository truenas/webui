import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldConfig } from '../../models/field-config.interface';

@Component ({
    selector: 'form-errors',
    templateUrl: './form-errors.component.html',
})
export class FormErrorsComponent{
    @Input()control: FormControl;
    @Input()config: FieldConfig;
}