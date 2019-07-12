import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, AbstractControl, FormControl } from '@angular/forms';

@Component({
    selector: 'app-dynamic-list',
    templateUrl: './dynamic-list.component.html',
    styleUrls: ['./dynamic-list.component.css']
})
export class DynamciListComponent implements OnInit {
    @Input() config: any;
    @Input() group: FormGroup;
    @Input() source: any;

    protected listControl: AbstractControl;
    protected inputConfig: any;
    protected inputControl: AbstractControl;

    constructor() { }

    ngOnInit() {
        // define input config and control
        this.inputConfig = {
            type: 'input',
            name: this.config.name + '_input',
            placeholder: this.config.placeholder,
            tooltip: this.config.tooltip,
        };
        this.group.controls[this.inputConfig.name] = new FormControl();

        this.inputControl = this.group.controls[this.inputConfig.name];
        this.listControl = this.group.controls[this.config.name];
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