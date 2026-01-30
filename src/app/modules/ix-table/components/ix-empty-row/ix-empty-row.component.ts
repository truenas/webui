import { TemplatePortal, CdkPortalOutlet } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, input, TemplateRef, ViewContainerRef, viewChild, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, tnIconMarker } from '@truenas/ui-components';
import { EmptyType } from 'app/enums/empty-type.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-empty-row',
  templateUrl: './ix-empty-row.component.html',
  styleUrls: ['./ix-empty-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkPortalOutlet,
    MatProgressSpinner,
    TnIconComponent,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class IxTableEmptyRowComponent implements AfterViewInit {
  private viewContainerRef = inject(ViewContainerRef);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  readonly conf = input<EmptyConfig>({
    title: this.translate.instant('No records'),
    message: this.translate.instant('There are no records to show.'),
    large: true,
    type: EmptyType.NoPageData,
  });

  readonly templatePortalContent = viewChild.required<TemplateRef<unknown>>('templatePortalContent');
  templatePortal: TemplatePortal;

  ngAfterViewInit(): void {
    this.templatePortal = new TemplatePortal(this.templatePortalContent(), this.viewContainerRef);
    this.cdr.detectChanges();
  }

  doAction(): void {
    const action = this.conf().button?.action;
    if (action) {
      action();
    }
  }

  isLoading(): boolean {
    return this.conf().type === EmptyType.Loading;
  }

  getIcon(): string {
    let icon: string = tnIconMarker('truenas-logo', 'custom');
    const conf = this.conf();
    if (conf.icon) {
      icon = conf.icon;
    } else {
      const type = conf.type;
      switch (type) {
        case EmptyType.Loading:
          icon = tnIconMarker('truenas-logo', 'custom');
          break;
        case EmptyType.FirstUse:
          icon = tnIconMarker('rocket', 'mdi');
          break;
        case EmptyType.NoPageData:
          icon = tnIconMarker('format-list-text', 'mdi');
          break;
        case EmptyType.Errors:
          icon = tnIconMarker('alert-octagon', 'mdi');
          break;
        case EmptyType.NoSearchResults:
          icon = tnIconMarker('magnify-scan', 'mdi');
          break;
        case EmptyType.None:
          icon = tnIconMarker('', 'mdi');
          break;
        default:
          assertUnreachable(type);
      }
    }
    return icon;
  }
}
