/* eslint-disable @angular-eslint/use-component-view-encapsulation */
/* eslint-disable @angular-eslint/no-host-metadata-property */

import {
  _DisposeViewRepeaterStrategy,
  _VIEW_REPEATER_STRATEGY,
} from '@angular/cdk/collections';
import {
  CDK_TABLE_TEMPLATE,
  CdkTable,
  CDK_TABLE,
  _CoalescedStyleScheduler,
  _COALESCED_STYLE_SCHEDULER,
  STICKY_POSITIONING_LISTENER,
} from '@angular/cdk/table';
import {
  ChangeDetectionStrategy, Component, ViewEncapsulation,
} from '@angular/core';
import { MatTable } from '@angular/material/table';

/**
 * Wrapper for the CdkTable with own design styles.
 */
@Component({
  selector: 'ix-table, table[ix-table]',
  exportAs: 'ixTable',
  template: CDK_TABLE_TEMPLATE,
  styleUrls: ['./ix-table.component.scss'],
  host: {
    class: 'ix-table',
    '[class.ix-table-fixed-layout]': 'fixedLayout',
  },
  providers: [
    { provide: _VIEW_REPEATER_STRATEGY, useClass: _DisposeViewRepeaterStrategy },
    { provide: CdkTable, useExisting: IxTableComponent },
    { provide: CDK_TABLE, useExisting: IxTableComponent },
    { provide: _COALESCED_STYLE_SCHEDULER, useClass: _CoalescedStyleScheduler },
    { provide: STICKY_POSITIONING_LISTENER, useValue: null },
  ],
  encapsulation: ViewEncapsulation.None,
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class IxTableComponent<T> extends MatTable<T> {}
