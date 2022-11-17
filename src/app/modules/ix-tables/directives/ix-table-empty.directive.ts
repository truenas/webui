import {
  AfterViewInit, Directive, ElementRef, Input, Renderer2, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@UntilDestroy()
@Directive({
  selector: '[ix-table-empty]',
})
export class IxTableEmptyDirective implements AfterViewInit {
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
    const innerHtml = this.elementRef.nativeElement.innerHTML;
    const emptyRow = `
      <tr *matNoDataRow class="mat-row no-data-row">
        <td class="mat-cell center" colspan="${this.displayedColumns.length}">
          <p>This is empty</p>
        </td>
      </tr>`;
    this.renderer2.setProperty(this.elementRef.nativeElement, 'innerHTML', innerHtml + emptyRow);
  }
}
