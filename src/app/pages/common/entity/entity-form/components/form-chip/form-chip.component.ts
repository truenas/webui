import { Component, OnInit } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { EntityFormService } from '../../services/entity-form.service';
import { Field } from '../../models/field.interface';
import globalHelptext from '../../../../../../helptext/global-helptext';

@Component({
    selector: 'form-chip',
    templateUrl: './form-chip.component.html',
    styleUrls: ['../dynamic-field/dynamic-field.css', './form-chip.component.css']
})
export class FormChipComponent implements Field, OnInit {
    config: FieldConfig;
    group: FormGroup;
    fieldShow: string;
    chipLists: any[];

    selectable = true;
    removable = true;
    addOnBlur = true;
    readonly separatorKeysCodes: number[] = [ENTER];

    constructor(
        public translate: TranslateService,
        private formService: EntityFormService) {
    }

    ngOnInit() {
        console.log(this.config, this.group);
        this.chipLists = this.group.controls[this.config.name].value || [];
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        if ((value || '').trim()) {
            this.chipLists.push(value.trim());
            this.group.controls[this.config.name].setValue(this.chipLists);
        }

        if (input) {
            input.value = '';
        }
    }

    remove(item): void {
        const index = this.chipLists.indexOf(item);

        if (index >= 0) {
            this.chipLists.splice(index, 1);
            this.group.controls[this.config.name].setValue(this.chipLists);
        }
    }
}
