import {
  Component, ElementRef, Input, OnInit, OnDestroy,
} from '@angular/core';
import { ModalService } from 'app/services/modal.service';

@Component({
  selector: 'jw-modal',
  templateUrl: 'modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() id: string;
  private element: HTMLElement;
  conf: any;
  formOpen = false;
  wizard = false;
  modal: HTMLElement;
  background: HTMLElement;
  slideIn: HTMLElement;
  title: string;

  constructor(private modalService: ModalService, private el: ElementRef) {
    this.element = el.nativeElement;
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.id) {
      console.error('modal must have an id');
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);

    // close modal on background click
    this.element.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).className === 'jw-modal') {
        this.close();
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
  open(conf: any): void {
    this.conf = conf;
    this.conf.isModalForm = true;
    this.conf.closeModalForm = this.close.bind(this);

    // Takes a bit for title to be set dynamically in the form
    const checkTitle = setInterval(() => {
      this.title = this.conf.title ? this.conf.title : '';
    }, 100);
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
    return new Promise((resolve) => {
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
