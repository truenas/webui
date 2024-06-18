import {
  ChangeDetectionStrategy, Component, Input, TemplateRef, ElementRef, Renderer2, AfterViewInit, ViewChild,
} from '@angular/core';

@Component({
  selector: 'ix-missing-access-wrapper',
  templateUrl: './missing-access-wrapper.component.html',
  styleUrls: ['./missing-access-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingAccessWrapperComponent implements AfterViewInit {
  @Input() template: TemplateRef<HTMLElement>;
  @Input() class: string;
  @ViewChild('wrapper', { static: true }) wrapper: ElementRef<HTMLElement>;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.disableFocusableElements();
  }

  private disableFocusableElements(): void {
    const focusableElements = this.wrapper.nativeElement.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]',
    );
    focusableElements.forEach((element: HTMLElement) => this.renderer.setAttribute(element, 'tabindex', '-1'));
  }
}
