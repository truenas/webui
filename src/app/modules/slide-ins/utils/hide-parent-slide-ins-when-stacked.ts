import { DOCUMENT } from '@angular/common';
import { EffectRef, effect, ElementRef, inject } from '@angular/core';
import { SlideIn } from 'app/modules/slide-ins/slide-in';

export function hideParentSlideInsWhenStacked(): EffectRef {
  const elementRef = inject(ElementRef<HTMLElement>);
  const document = inject(DOCUMENT);
  const slideIn = inject(SlideIn);

  return effect((onCleanup) => {
    const currentContainer = elementRef.nativeElement.closest('ix-slide-in-container') as HTMLElement | null;
    if (!currentContainer) {
      return;
    }

    const hiddenContainers: { element: HTMLElement; display: string }[] = [];

    if (slideIn.openSlideIns() > 1) {
      const containers = Array.from(document.querySelectorAll('ix-slide-in-container')) as HTMLElement[];

      containers.forEach((container) => {
        if (container === currentContainer) {
          return;
        }

        hiddenContainers.push({
          element: container,
          display: container.style.display,
        });
        container.style.display = 'none';
      });
    }

    onCleanup(() => {
      hiddenContainers.forEach(({ element, display }) => {
        element.style.display = display;
      });
    });
  });
}
