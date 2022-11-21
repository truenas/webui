import { TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit, ChangeDetectorRef, Component, Input, TemplateRef, ViewChild, ViewContainerRef,
} from '@angular/core';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Component({
  selector: 'ix-empty-row',
  templateUrl: './ix-empty-row.component.html',
})
export class IxEmptyRowComponent implements AfterViewInit {
  @Input() displayedColumns: string[];
  @Input() emptyConfig: EmptyConfig;

  @ViewChild('templatePortalContent') templatePortalContent: TemplateRef<unknown>;
  templatePortal: TemplatePortal<any>;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    // console.log('templatePortalContent', this.templatePortalContent);
    this.templatePortal = new TemplatePortal(this.templatePortalContent, this.viewContainerRef);
    this.cdr.markForCheck();
  }
}
