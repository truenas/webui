import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';

import { EntityFormService } from '../../../../../common/entity/entity-form/services/entity-form.service';
@Component({
    selector: 'app-dynamic-list',
    templateUrl: './dynamic-list.component.html',
    styleUrls: ['./dynamic-list.component.css']
})
export class DynamciListComponent implements OnInit {
    @Input() config: any;
    @Input() group: FormGroup;
    @Input() source: any;

    public listControl: AbstractControl;
    public inputConfig: any;
    public inputControl: AbstractControl;
    public formGroup: FormGroup;
    constructor(private entityFormService: EntityFormService) { }

    ngOnInit() {
        // define input config and control
        this.inputConfig = {
            type: 'input',
            name: this.config.name + '_input',
            placeholder: this.config.placeholder,
            tooltip: this.config.tooltip,
            validation: this.config.validation ? this.config.validation : [],
        };
        this.formGroup = this.entityFormService.createFormGroup([this.inputConfig]);
        this.inputControl = this.formGroup.controls[this.inputConfig.name]

        this.listControl = this.group.controls[this.config.name];

        if (this.config.validation) {
            this.inputControl.setValidators(this.inputConfig.validation);
            this.inputControl.updateValueAndValidity();
        }

        if (this.listControl.value === undefined) {
            this.listControl.setValue(new Set([]));
        }
        this.listControl.statusChanges.subscribe((res) => {
            const method = res === 'DISABLED' ? 'disable' : 'enable';
            this.inputControl[method]();
        })
    }

    add() {
        this.listControl.value.add(this.inputControl.value);
        this.inputControl.setValue(null);
    }
    remove(item) {
        this.listControl.value.delete(item);
    }
    drop() {
        this.config.customEventMethod(this);
    }
}