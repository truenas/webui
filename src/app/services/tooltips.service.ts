

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject, Subscription} from 'rxjs';

import {Tooltip} from '../pages/common/tooltip';
import {TOOLTIPS} from '../pages/common/tooltips';

@Injectable()
export class TooltipsService {
  getTooltips(): Promise<Tooltip[]> { return Promise.resolve(TOOLTIPS); }

  getTooltip(tooltip_id): Promise<Tooltip> {
    for (var i = TOOLTIPS.length - 1; i >= 0; i--) {
      if (TOOLTIPS[i]['id'] == tooltip_id) {
        return Promise.resolve(TOOLTIPS[i]);
      }
    }
  }
}