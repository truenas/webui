import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

import { ModalService } from '../../../services/modal.service';

@Component({
    selector: 'jw-modal',
    template: 
        `<div class={{id}} [ngClass]="id!=='slide-in-form' ? 'jw-modal' : ''">
            <div class="jw-modal-body">
                <mat-icon id="close-icon" (click)="close()">close</mat-icon>
                <entity-form [conf]="conf" *ngIf="formOpen" class="slidein-entity-form"></entity-form>
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
        const modal = document.querySelector(`.${this.id}`);
        const background = document.querySelector(`.${this.id}-background`)
        modal.classList.add('open');
        background.classList.add('open');
        this.formOpen = true;
        console.log(this.formOpen)
        document.body.classList.add('jw-modal-open');
    }

    // close modal
    close(): void {
        const modal = document.querySelector(`.${this.id}`);
        const background = document.querySelector(`.${this.id}-background`)
        modal.classList.remove('open');
        background.classList.remove('open');
        document.body.classList.remove('jw-modal-open');
        this.formOpen = false;
        console.log(this.formOpen)
    }
}