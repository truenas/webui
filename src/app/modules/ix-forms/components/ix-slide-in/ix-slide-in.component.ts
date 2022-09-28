import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-slide-in',
  templateUrl: './ix-slide-in.component.html',
  styleUrls: ['./ix-slide-in.component.scss'],
})
export class IxSlideInComponent implements OnInit, OnDestroy {
  @Input() id: string;
  @ViewChild('body', { static: true, read: ViewContainerRef }) slideInBody: ViewContainerRef;

  @HostListener('document:keydown.escape') onKeydownHandler(): void {
    if (this.element) {
      this.close();
    }
  }

  isSlideInOpen = false;
  wide = false;
  private element: HTMLElement;

  constructor(
    private el: ElementRef,
    protected slideInService: IxSlideInService,
  ) {
    this.element = this.el.nativeElement;
  }

  close(): void {
    this.slideInService.close();
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.id) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);

    // close modal on background click
    this.element.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).className === 'ix-slide-in') {
        this.close();
      }
    });

    this.slideInService.setModal(this);
  }

  ngOnDestroy(): void {
    this.element.remove();
    this.slideInService.close();
  }

  closeSlideIn(): void {
    this.isSlideInOpen = false;

    setTimeout(() => {
      // Destroying child component later improves performance a little bit.
      // 200ms matches transition duration
      this.slideInBody.clear();
    }, 200);
  }

  openSlideIn<T>(componentType: Type<T>, params?: { wide: boolean }): T {
    this.isSlideInOpen = true;
    this.wide = !!params?.wide;

    this.slideInBody.clear();

    const componentRef = this.slideInBody.createComponent<T>(componentType);
    return componentRef.instance;
  }
}
