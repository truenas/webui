import {
  Component, ComponentFactoryResolver, ElementRef, HostListener, Input, OnDestroy, OnInit, Type, ViewChild,
} from '@angular/core';
import { IxModalDirective } from 'app/pages/common/ix-forms/components/ix-modal/ix-modal.directive';
import { IxModalService } from 'app/services/ix-modal.service';

@Component({
  selector: 'ix-slide-in',
  templateUrl: './ix-modal.component.html',
  styleUrls: ['./ix-modal.component.scss'],
})
export class IxModalComponent implements OnInit, OnDestroy {
  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(): void {
    this.close();
  }
  @Input() id: string;
  @ViewChild(IxModalDirective, { static: true }) ixModal: IxModalDirective;
  private element: HTMLElement;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private el: ElementRef,
    protected modalService: IxModalService,
  ) {
    this.element = this.el.nativeElement;
  }

  close(): void {
    this.modalService.close();
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.id) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);

    // close modal on background click
    this.element.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).className === 'ix-modal') {
        this.close();
      }
    });

    this.modalService.setModal(this);
  }

  ngOnDestroy(): void {
    this.element.remove();
    this.modalService.close();
  }

  closeModal(): void {
    const modalInDom: HTMLElement = document.querySelector(`.ix-${this.id}`);
    const backgroundInDom: HTMLElement = document.querySelector(`.ix-${this.id}-background`);

    if (modalInDom) {
      modalInDom.classList.remove('open');
    }

    if (backgroundInDom) {
      backgroundInDom.classList.remove('open');
    }
    document.body.classList.remove('ix-modal-open');
  }

  openModal<T>(modal: Type<T>): T {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(modal);

    const viewContainerRef = this.ixModal.viewContainerRef;
    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent<T>(componentFactory);

    const modalInDom: HTMLElement = document.querySelector(`.ix-${this.id}`);
    const backgroundInDom: HTMLElement = document.querySelector(`.ix-${this.id}-background`);

    modalInDom.classList.add('open');
    backgroundInDom.classList.add('open');
    document.body.classList.add('ix-modal-open');
    return componentRef.instance;
  }
}
