import {
  AfterViewInit, Directive, ElementRef, Input, Renderer2, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@UntilDestroy()
@Directive({
  selector: '[ixEmpty]',
})
export class IxEmptyDirective implements AfterViewInit {
  @Input() displayedColumns: string[];
  @Input() emptyConfig: EmptyConfig = {
    title: this.translate.instant('Rehan'),
    message: this.translate.instant('Rehan 2'),
    large: false,
    type: EmptyType.NoPageData,
  };

  constructor(
    private translate: TranslateService,
    private elementRef: ElementRef,
    private renderer2: Renderer2,
    private viewContainerRef: ViewContainerRef,
  ) { }

  ngAfterViewInit(): void {
    this.viewContainerRef.createComponent();
    this.renderer2.setProperty(this.elementRef.nativeElement, 'innerHTML', innerHtml + emptyRow);
  }
}
