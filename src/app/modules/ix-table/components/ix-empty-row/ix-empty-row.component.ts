import { TemplatePortal, CdkPortalOutlet } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  input,
  TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { iconMarker, MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-empty-row',
  templateUrl: './ix-empty-row.component.html',
  styleUrls: ['./ix-empty-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkPortalOutlet,
    MatProgressSpinner,
    IxIconComponent,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class IxTableEmptyRowComponent implements AfterViewInit {
  readonly conf = input<EmptyConfig>({
    title: this.translate.instant('No records'),
    message: this.translate.instant('There are no records to show.'),
    large: true,
    type: EmptyType.NoPageData,
  });

  readonly templatePortalContent = viewChild.required<TemplateRef<unknown>>('templatePortalContent');
  templatePortal: TemplatePortal;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

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

  getIcon(): MarkedIcon {
    let icon = iconMarker('ix-truenas-logo');
    const conf = this.conf();
    if (conf.icon) {
      icon = conf.icon;
    } else {
      const type = conf.type;
      switch (type) {
        case EmptyType.Loading:
          icon = iconMarker('ix-truenas-logo');
          break;
        case EmptyType.FirstUse:
          icon = iconMarker('mdi-rocket');
          break;
        case EmptyType.NoPageData:
          icon = iconMarker('mdi-format-list-text');
          break;
        case EmptyType.Errors:
          icon = iconMarker('mdi-alert-octagon');
          break;
        case EmptyType.NoSearchResults:
          icon = iconMarker('mdi-magnify-scan');
          break;
        case EmptyType.None:
          icon = iconMarker('');
          break;
        default:
          assertUnreachable(type);
      }
    }
    return icon;
  }
}
