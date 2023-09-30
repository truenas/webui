import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Injectable()
export class TableService {
  // TODO: Remove in favor of a ix-interface-status-icon and classes
  updateStateInfoIcon(elemntId: string, type: 'sent' | 'received'): void {
    const targetEl = document.getElementById(elemntId);
    const targetIcon = targetEl?.firstElementChild;
    if (targetIcon) {
      const arrowIcons = targetIcon.getElementsByClassName('arrow');
      const targetIconEl = type === 'sent' ? arrowIcons[0] : arrowIcons[1];

      setTimeout(() => {
        targetIconEl.classList.add('active');
      }, 0);

      setTimeout(() => {
        targetIconEl.classList.remove('active');
      }, 2000);
    }
  }
}
