import { TemplatePortal, CdkPortalOutlet } from '@angular/cdk/portal';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, TemplateRef, ViewChild, ViewContainerRef,
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
  standalone: true,
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
  @Input() conf: EmptyConfig = {
    title: this.translate.instant('No records'),
    message: this.translate.instant('There are no records to show.'),
    large: true,
    type: EmptyType.NoPageData,
  };

  @ViewChild('templatePortalContent') templatePortalContent: TemplateRef<unknown>;
  templatePortal: TemplatePortal;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.templatePortal = new TemplatePortal(this.templatePortalContent, this.viewContainerRef);
    this.cdr.detectChanges();
  }

  doAction(): void {
    if (this.conf.button.action) {
      this.conf.button.action();
    }
  }

  isLoading(): boolean {
    return this.conf.type === EmptyType.Loading;
  }

  getIcon(): MarkedIcon {
    let icon = iconMarker('ix-truenas-logo');
    if (this.conf.icon) {
      icon = this.conf.icon;
    } else {
      switch (this.conf.type) {
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
        default:
          assertUnreachable(this.conf.type);
      }
    }
    return icon;
  }
}
