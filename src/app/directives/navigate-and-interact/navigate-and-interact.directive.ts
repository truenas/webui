import {
  Directive, HostListener, input,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Directive({
  selector: '[ixNavigateAndInteract]',
})
export class NavigateAndInteractDirective {
  readonly navigateRoute = input.required<string[]>();
  readonly navigateHash = input.required<string>();

  constructor(private router: Router) {}

  @HostListener('click')
  onClick(): void {
    this.router.navigate(this.navigateRoute(), { fragment: this.navigateHash() }).then(() => {
      const htmlElement = document.getElementById(this.navigateHash());
      if (htmlElement) {
        this.handleHashScrollIntoView(htmlElement);
      }
    });
  }

  private handleHashScrollIntoView(htmlElement: HTMLElement): void {
    const highlightedClass = 'highlighted-element';
    setTimeout(() => {
      htmlElement.scrollIntoView({ block: 'center' });
      htmlElement.classList.add(highlightedClass);
      htmlElement.click();
    }, 150);
    setTimeout(() => htmlElement.classList.remove(highlightedClass), 2150);
  }
}
