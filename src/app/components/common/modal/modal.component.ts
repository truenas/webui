import { Component, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

import { ModalService } from '../../../services/modal.service';

@Component({
    selector: 'jw-modal',
    template: 
        `<div [ngClass]="id==='slide-in-form' ? 'slide-in-form' : 'jw-modal'">
            <div class="jw-modal-body">
                <ng-content></ng-content>
            </div>
        </div>
        <div class="jw-modal-background" (click)="close()"></div>`,
    styleUrls: ['./modal.component.css'],

})
export class ModalComponent implements OnInit, OnDestroy {
    @Input() id: string;
    private element: any;

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
    open(): void {
        this.element.style.display = 'block';
        document.body.classList.add('jw-modal-open');
    }

    // close modal
    close(): void {
        this.element.style.display = 'none';
        document.body.classList.remove('jw-modal-open');
    }
}