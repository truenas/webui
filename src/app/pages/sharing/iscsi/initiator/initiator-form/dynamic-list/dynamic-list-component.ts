import { Component, OnInit, Input } from '@angular/core';
import { selector } from 'd3';
import { FormGroup } from '@angular/forms';

@Component ({
    selector: 'app-dynamic-list',
    templateUrl: './dynamic-list.component.html',
    styleUrls: ['./dynamic-list.component.css']
})
export class DynamciListComponent implements OnInit {
    @Input() config: any;
    @Input() group: FormGroup;
    // @Input() lists: any;
    @Input() source: any;

    public lists: any;
    constructor() {}

    ngOnInit() {

        this.lists = this.group.controls[this.config.name.substring(0, this.config.name.length - 4)].value;
        console.log(this.config, this.group, this.lists);
        this.source.selectionChange.subscribe((res) => {
            console.log(res);

                console.log(this.source.selectedOptions);
                
        })
    }
}