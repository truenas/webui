import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

import { ModalService } from '../../../services/modal.service';

@Component({
    selector: 'jw-modal',
    template: 
        `<div class={{id}} [ngClass]="id!=='slide-in-form' ? 'jw-modal' : ''">
            <div class="jw-modal-body">
                <div class="slidein-title-bar" fxLayout="row" >
                    <div fxFlex="90%" fxLayout="row" fxLayoutAlign="start center">
                        <h3 class="formtitle">{{title | translate}}</h3>
                        <div style="color:var(--fg2);" *ngIf="conf && conf.titleBarControls" class="control-group" fxLayout="row" fxLayoutAlign="start center">
                            <div *ngFor="let control of conf.titleBarControls" style="margin: 0 8px;">
                                <toolbar-button *ngIf="control.type == 'button'" [config]="control" [controller]="conf.controller" ></toolbar-button>
                                <toolbar-slider *ngIf="control.type == 'slider'" [config]="control" [controller]="conf.controller" ></toolbar-slider>
                                <toolbar-input *ngIf="control.type == 'input'" [config]="control" [controller]="conf.controller" ></toolbar-input>
                                <toolbar-menu *ngIf="control.type == 'menu'" [config]="control" [controller]="conf.controller" style="max-height:36px;"></toolbar-menu>
                                <toolbar-checkbox *ngIf="control.type == 'checkbox'" [config]="control" [controller]="conf.controller"></toolbar-checkbox>
                            </div>
                        </div>
                    </div>                    
                    <mat-icon fxFlex="10%" id="close-icon" (click)="close()">cancel</mat-icon>      
                </div>
                <ng-container *ngIf="!wizard; else wizardBlock">
                  <ng-container *ngIf="(formOpen && conf && !conf.formType) || (formOpen && conf && conf.formType == 'EntityFormComponent') ">
                    <entity-form *ngIf="conf.fieldSets" [conf]="conf" class="slidein-entity-form"></entity-form>
                  </ng-container>
                  <ng-container *ngIf="formOpen && conf && conf.formType && conf.formType == 'EntityFormEmbeddedComponent' ">
                    <entity-form-embedded *ngIf="conf.fieldSets && conf.target && conf.data" [target]="conf.target" [data]="conf.values" [conf]="conf" class="slidein-entity-form"></entity-form-embedded>
                  </ng-container>
                </ng-container>
                <ng-template #wizardBlock>
                    <entity-wizard [conf]="conf" *ngIf="formOpen" class="slidein-entity-form"></entity-wizard>         
                </ng-template>
            </div>
        </div>
        <div class="jw-modal-background {{id}}-background" (click)="close()"></div>`,
    styleUrls: ['./modal.component.css'],

})
export class ModalComponent implements OnInit, OnDestroy {
    @Input() id: string;
    private element: any;
    public conf: any;
    public formOpen = false;
    public wizard = false;
    modal;
    background;
    slideIn;
    title;

    constructor(private modalService: ModalService, private el: ElementRef) {
        this.element = el.nativeElement;
    }

    ngOnInit(): void {
        let modal = this;

        // ensure id attribute exists
        if (!this.id) {
            console.error('modal must have an id');
            return;
        }

        // move element to bottom of page (just before </body>) so it can be displayed above everything else
        document.body.appendChild(this.element);

        // close modal on background click
        this.element.addEventListener('click', function (e: any) {
            if (e.target.className === 'jw-modal') {
                modal.close();
            }
        });

        // add self (this modal instance) to the modal service so it's accessible from controllers
        this.modalService.add(this);

    }

    // remove self from modal service when component is destroyed
    ngOnDestroy(): void {
        this.modalService.remove(this.id);
        this.element.remove();
    }

    // open modal
    open(conf:any): void {
        this.conf = conf;
        this.conf.isModalForm = true;
        this.conf.closeModalForm = this.close.bind(this);

        // Takes a bit for title to be set dynamically in the form
        const checkTitle = setInterval(() => {
            this.title = this.conf.title ? this.conf.title : '';
        }, 100)
        setTimeout(() => {
            clearInterval(checkTitle);
        }, 1000);
        this.modal = document.querySelector(`.${this.id}`);
        this.background = document.querySelector(`.${this.id}-background`);
        this.slideIn = document.querySelector('.slide-in-form');

        if (conf.wizardConfig) {
            this.wizard = true;
        }
        this.modal.classList.add('open');
        this.background.classList.add('open');
        this.formOpen = true;
        document.body.classList.add('jw-modal-open');

        this.conf.columnsOnForm = 1;
        if (this.el.nativeElement.offsetWidth >= 960 && !this.conf.isOneColumnForm) {
            this.conf.columnsOnForm = 2;
            this.slideIn.classList.add('wide');
        }
    }

    // close modal
    close(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.modal.classList.remove('open');
            this.background.classList.remove('open');
            document.body.classList.remove('jw-modal-open');
            this.slideIn.classList.remove('wide');
            this.formOpen = false;
            this.modalService.refreshForm();
            this.wizard = false;
            this.title = '';
            resolve(true);
        });
    }
}
