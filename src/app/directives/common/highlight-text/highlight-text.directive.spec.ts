import { ElementRef, Renderer2 } from '@angular/core';
import { HighlightTextDirective } from './highlight-text.directive';

describe('HighlightTextDirective', () => {
  let directive: HighlightTextDirective;
  let elementRefMock: Partial<ElementRef>;
  let renderer2Mock: Partial<Renderer2>;

  beforeEach(() => {
    elementRefMock = {
      nativeElement: document.createElement('div'),
    };
    renderer2Mock = {
      addClass: jest.fn(),
    };

    directive = new HighlightTextDirective(elementRefMock as ElementRef, renderer2Mock as Renderer2);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should add "highlighted-text" class on ngOnInit', () => {
    directive.ngOnInit();
    expect(renderer2Mock.addClass).toHaveBeenCalledWith(elementRefMock.nativeElement, 'highlighted-text');
  });
});
