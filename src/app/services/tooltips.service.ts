import { Injectable } from '@angular/core';
import { Tooltip } from 'app/pages/common/tooltip';
import { TOOLTIPS } from 'app/pages/common/tooltips';

@Injectable()
export class TooltipsService {
  getTooltips(): Promise<Tooltip[]> { return Promise.resolve(TOOLTIPS); }

  getTooltip(tooltip_id: string): Promise<Tooltip> {
    for (var i = TOOLTIPS.length - 1; i >= 0; i--) {
      if (TOOLTIPS[i]['id'] == tooltip_id) {
        return Promise.resolve(TOOLTIPS[i]);
      }
    }
  }
}
