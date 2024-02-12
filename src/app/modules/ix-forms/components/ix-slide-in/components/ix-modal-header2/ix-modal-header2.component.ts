import {
  AfterViewInit, ChangeDetectionStrategy, Component, Inject, Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CHAINED_SLIDE_IN_REF } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { ChainedComponentRef, IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-modal-header2',
  templateUrl: './ix-modal-header2.component.html',
  styleUrls: ['./ix-modal-header2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxModalHeader2Component implements AfterViewInit {
  @Input() title: string;
  @Input() loading: boolean;
  @Input() disableClose = false;
  componentsSize = 1;

  tooltip = this.translate.instant('Close the form');

  constructor(
    private translate: TranslateService,
    private chainedSlideIn: IxChainedSlideInService,
    @Inject(CHAINED_SLIDE_IN_REF) private chainedSlideInRef: ChainedComponentRef,
  ) {}

  ngAfterViewInit(): void {
    this.chainedSlideIn.components$.pipe(
      untilDestroyed(this),
    ).subscribe((components) => {
      this.componentsSize = components.length;
      if (components.length > 1) {
        this.tooltip = this.translate.instant('Go back to the previous form');
      } else {
        this.tooltip = this.translate.instant('Close the form');
      }
    });
  }

  close(): void {
    this.chainedSlideInRef.close({ response: false, error: null });
  }
}
