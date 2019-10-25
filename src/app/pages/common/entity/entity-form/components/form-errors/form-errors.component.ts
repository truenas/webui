import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldConfig } from '../../models/field-config.interface';

@Component ({
    selector: 'form-errors',
    templateUrl: './form-errors.component.html',
})
export class FormErrorsComponent implements OnInit{
    @Input()control: FormControl;
    @Input()config: FieldConfig;

    constructor(){}
    ngOnInit() {
        console.log(this.control, this.config);
    }
}