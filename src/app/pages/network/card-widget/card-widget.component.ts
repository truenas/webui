import { Component, Input, OnInit } from '@angular/core';

export interface CardWidgetConf {
    title: string,
    data: any,
    parent: any,
    icon?: string,
    showGroupTitle?: boolean;
    name?:string,
    onclick?(),
}

@Component ({
    selector: 'card-widget',
    templateUrl: './card-widget.component.html',
    styleUrls: ['./card-widget.component.css'],
})
export class CardWidgetComponent implements OnInit{
    @Input('conf') widgetConf: CardWidgetComponent;

    constructor(){}

    ngOnInit() {
    }

}