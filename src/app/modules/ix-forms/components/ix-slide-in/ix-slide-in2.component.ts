import {
  Component,
  ElementRef,
  HostListener,
  Injector,
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
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';

@UntilDestroy()
@Component({
  selector: 'ix-slide-in2',
  templateUrl: './ix-slide-in2.component.html',
  styleUrls: ['./ix-slide-in2.component.scss'],
})
export class IxSlideIn2Component implements OnInit, OnDestroy {
  @Input() id: string;
  @ViewChild('body', { static: true, read: ViewContainerRef }) slideInBody: ViewContainerRef;
  @ViewChild('slideIn', { static: true, read: ElementRef }) slideIn: ElementRef<HTMLElement>;

  @HostListener('document:keydown.escape') onKeydownHandler(): void {
    this.slideInRefClose();
  }

  isSlideInOpen = false;
  wide = false;
  private element: HTMLElement;
  private wasBodyCleared = false;
  private timeOutOfClear: Subscription;
  counterId = 0;

  constructor(
    private el: ElementRef,
    protected slideIn2Service: IxSlideIn2Service,
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
    this.slideIn2Service.setModal(this);
  }

  slideInRefClose(): void {
    if (!this.element || !this.isSlideInOpen) { return; }

    const slideContentId = (this.slideIn.nativeElement.firstChild as HTMLElement).getAttribute('id');
    const ixSlideInRef = this.slideIn2Service.slideInRefList.find((ref) => {
      const instanceElementId = (ref.hostOfInstance as HTMLElement).getAttribute('id');
      return instanceElementId === slideContentId;
    });

    ixSlideInRef.close();
  }

  closeSlideIn(id: string): void {
    this.isSlideInOpen = false;
    this.wasBodyCleared = true;
    this.slideIn2Service.slideInRefList = this.slideIn2Service.slideInRefList.filter((ref) => ref.uuid !== id);
    this.timeOutOfClear = timer(200).pipe(untilDestroyed(this)).subscribe(() => {
      // Destroying child component later improves performance a little bit.
      // 200ms matches transition duration
      this.slideInBody.clear();
      this.wasBodyCleared = false;
    });
  }

  openSlideIn<T, R>(
    componentType: Type<T>,
    params?: { wide?: boolean; data?: R },
  ): IxSlideInRef<T, R> {
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

    return this.createSlideInRef<T, R>(componentType, params?.data);
  }

  createSlideInRef<T, R>(
    componentType: Type<T>,
    data?: R,
  ): IxSlideInRef<T, R> {
    const slideInRef = new IxSlideInRef<T, R>(this);
    const injector = Injector.create({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: data },
        { provide: IxSlideInRef, useValue: slideInRef },
      ],
    });
    slideInRef.componentRef = this.slideInBody.createComponent<T>(componentType, { injector });
    slideInRef.uuid = UUID.UUID();
    (slideInRef.hostOfInstance as HTMLElement).setAttribute('id', `inserted-content-${this.counterId += 1}`);

    return slideInRef;
  }

  ngOnDestroy(): void {
    this.element.remove();
    this.slideIn2Service.closeAll();
  }
}
