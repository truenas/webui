import { Directive, HostBinding, HostListener, Input, OnChanges } from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';

@Directive({
  selector: '[ixAppImgFallback]',
  standalone: true,
})
export class FallbackImageDirective implements OnChanges {
  @Input() src: string;
  @HostBinding('src') imageSource: string;
  @HostListener('error') onError(): void {
    this.imageSource = appImagePlaceholder;
  }

  ngOnChanges(): void {
    this.imageSource = this.src ? this.src : appImagePlaceholder;
  }
}
