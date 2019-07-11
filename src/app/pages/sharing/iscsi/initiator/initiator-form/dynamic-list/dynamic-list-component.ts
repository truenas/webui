import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';

@Component({
    selector: 'app-dynamic-list',
    templateUrl: './dynamic-list.component.html',
    styleUrls: ['./dynamic-list.component.css']
})
export class DynamciListComponent implements OnInit {
    @Input() config: any;
    @Input() group: FormGroup;
    @Input() source: any;

    public lists: any;
    protected listControl: AbstractControl;
    protected inputControl: AbstractControl;

    constructor() { }

    ngOnInit() {
        this.inputControl = this.group.controls[this.config.name];
        this.listControl = this.group.controls[this.config.name.substring(0, this.config.name.length - 4)];
        this.lists = this.listControl.value;
        console.log(this.config, this.group, this.lists);
        this.source.selectionChange.subscribe((res) => {
            console.log(res);

            console.log(this.source.selectedOptions);

        })
    }

    add() {
        this.listControl.value.push(this.inputControl.value);
        this.inputControl.setValue(undefined);
    }
    delete(index) {
        this.listControl.value.splice(index, 1);
    }
}