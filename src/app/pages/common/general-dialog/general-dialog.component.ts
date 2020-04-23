import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog'
import { TranslateService } from '@ngx-translate/core';

export interface GeneralDialogConfig {
    title: string,
    message: string,
    icon?: string,
    is_html?: boolean,
}

@Component({
    selector: 'app-general-dialog',
    templateUrl: './general-dialog.component.html',
    styleUrls: ['./general-dialog.component.scss']
})
export class GeneralDialogComponent implements OnInit {
    @Input() conf: GeneralDialogConfig;

    public title: string;
    public message: string;
    public icon: string;
    public is_html: boolean;
    constructor(public dialogRef: MatDialogRef<GeneralDialogComponent>, protected translate: TranslateService) {
    }

    ngOnInit() {
        this.title = this.conf.title;
        this.message = this.conf.message;
        this.icon = this.conf.icon ? this.conf.icon : 'report_problem';
        this.is_html = this.conf.is_html !== undefined ? this.conf.is_html : false;
    }
}