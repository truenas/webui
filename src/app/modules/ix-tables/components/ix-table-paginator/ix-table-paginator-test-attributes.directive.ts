import {
  AfterViewInit, Directive, ElementRef, HostListener,
} from '@angular/core';

// This is temporary, we need to refactor components to use ix-table2.
// It is a fix for a DragonFish release to add data-test attributes to the ix-table-paginator.
@Directive({
  selector: '[ixTablePaginatorTestAttributes]',
})
export class IxTablePaginatorTestAttributesDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('click')
  onClick(): void {
    this.addMatOptionTestAttributes();
  }

  ngAfterViewInit(): void {
    this.addMainTestAttributes();
  }

  private addMainTestAttributes(): void {
    const matSelect = this.el.nativeElement.querySelector('.mat-mdc-paginator-page-size .mat-mdc-select');
    matSelect?.setAttribute('data-test', 'select-page-size');

    const maxLeftButton = this.el.nativeElement.querySelector('.mat-mdc-paginator-navigation-first');
    maxLeftButton?.setAttribute('data-test', 'button-max-left');

    const leftButton = this.el.nativeElement.querySelector('.mat-mdc-paginator-navigation-previous');
    leftButton?.setAttribute('data-test', 'button-left');

    const maxRightButton = this.el.nativeElement.querySelector('.mat-mdc-paginator-navigation-last');
    maxRightButton?.setAttribute('data-test', 'button-max-right');

    const rightButton = this.el.nativeElement.querySelector('.mat-mdc-paginator-navigation-next');
    rightButton?.setAttribute('data-test', 'button-right');
  }

  private addMatOptionTestAttributes(): void {
    const options = document.querySelectorAll('mat-option');

    if (options) {
      options.forEach((option) => {
        (option as HTMLElement)?.setAttribute(
          'data-test',
          `option-page-size-option-${option.textContent.replace(/\s+/g, '')}`,
        );
      });
    }
  }
}
