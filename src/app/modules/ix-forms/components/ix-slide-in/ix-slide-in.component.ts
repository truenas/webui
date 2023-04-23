import {
  Component,
  ElementRef,
  HostListener, Injector,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { Subscription, timer } from 'rxjs';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
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
  @ViewChild('overlay', { static: true, read: ViewContainerRef }) overlayElement: ElementRef<HTMLElement>;

  @HostListener('document:keydown.escape') onKeydownHandler(): void {
    if (this.element) {
      const overlayId: string = this.overlayElement.nativeElement.getAttribute('id');
      this.closeSlideIn(overlayId);
    }
  }

  isSlideInOpen = false;
  wide = false;
  private element: HTMLElement;
  timeOutOfClear: Subscription;
  wasBodyCleared = false;
  slideInRefList: IxSlideInRef<unknown>[] = [];
  overlayId: string;

  constructor(
    private el: ElementRef,
    protected slideInService: IxSlideInService,
  ) {
    this.element = this.el.nativeElement;
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.id) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);
    this.slideInService.setModal(this);
  }

  closeSlideIn(id?: string): void {
    this.isSlideInOpen = false;
    this.wasBodyCleared = true;

    if (id) {
      this.slideInRefList = this.slideInRefList.filter((ref) => ref.uuid !== id);
    }

    this.timeOutOfClear = timer(200).pipe(untilDestroyed(this)).subscribe(() => {
      // Destroying child component later improves performance a little bit.
      // 200ms matches transition duration
      this.slideInBody.clear();
      this.wasBodyCleared = false;
    });
  }

  openSlideIn<T>(
    componentType: Type<T>,
    params?: { wide?: boolean; data?: { [key: string]: unknown } },
  ): IxSlideInRef<T> {
    if (this.isSlideInOpen) {
      console.error('SlideIn is already open');
    }

    this.isSlideInOpen = true;
    this.wide = !!params?.wide;

    if (this.wasBodyCleared) {
      this.timeOutOfClear.unsubscribe();
    }
    this.slideInBody.clear();
    this.wasBodyCleared = false;
    // clear body and close all slides
    this.slideInRefList.forEach((ref) => ref.close());
    this.slideInRefList = [];
    // the componentType will be removed
    return this.createSlideInRef(componentType, params);
  }

  createSlideInRef<T>(
    componentType: Type<T>,
    params?: { wide?: boolean; data?: { [key: string]: unknown } },
  ): IxSlideInRef<T> {
    const slideInRef = new IxSlideInRef<T>(this, componentType);
    this.slideInRefList.push(slideInRef);

    const injector = Injector.create({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: params?.data },
        { provide: IxSlideInRef, useValue: slideInRef },
      ],
    });
    const componentRef = this.slideInBody.createComponent<T>(componentType, { injector });
    slideInRef.componentInstance = componentRef.instance;
    slideInRef.uuid = UUID.UUID();
    this.overlayId = slideInRef.uuid;

    return slideInRef;
  }

  ngOnDestroy(): void {
    this.element.remove();
    this.slideInService.closeAll();
  }
}
