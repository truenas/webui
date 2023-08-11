import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription, timer } from 'rxjs';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
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
  timeOutOfClear: Subscription;
  wasBodyCleared = false;

  constructor(
    private el: ElementRef,
    private slideInService: IxSlideInService,
    private renderer: Renderer2,
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

  closeSlideIn(): void {
    this.isSlideInOpen = false;
    this.renderer.removeStyle(document.body, 'overflow');
    this.wasBodyCleared = true;

    this.timeOutOfClear = timer(200).pipe(untilDestroyed(this)).subscribe(() => {
      // Destroying child component later improves performance a little bit.
      // 200ms matches transition duration
      this.slideInBody.clear();
      this.wasBodyCleared = false;
    });
  }

  openSlideIn<T>(componentType: Type<T>, params?: { wide: boolean }): T {
    this.isSlideInOpen = true;
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
    this.wide = !!params?.wide;

    if (this.wasBodyCleared) {
      this.timeOutOfClear.unsubscribe();
    }
    this.slideInBody.clear();
    this.wasBodyCleared = false;

    const componentRef = this.slideInBody.createComponent<T>(componentType);
    return componentRef.instance;
  }

  ngOnDestroy(): void {
    this.element.remove();
    this.slideInService.close();
  }
}
