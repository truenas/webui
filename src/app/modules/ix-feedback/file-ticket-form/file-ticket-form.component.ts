import {
  Component,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import _ from 'lodash';
import { Observable } from 'rxjs';
import {
  filter, map, switchMap,
} from 'rxjs/operators';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { Option } from 'app/interfaces/option.interface';
import {
  CreateNewTicket,
} from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-form.component.html',
})
export class FileTicketFormComponent {
  token = new FormControl<string>('', [Validators.required]);
  title = new FormControl<string>('', [Validators.required]);
  category = new FormControl<string>({ value: '', disabled: true }, [Validators.required]);
  categoryOptions$: Observable<Option[]> = this.token.valueChanges.pipe(
    switchMap((token) => this.ws.call('support.fetch_categories', [token])),
    map((choices) => Object.entries(choices).map(([label, value]) => ({ label, value }))),
    map((options) => _.sortBy(options, ['label'])),
  );
  readonly tooltips = {
    token: helptext.token.tooltip,
    category: helptext.category.tooltip,
    title: helptext.title.tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private systemGeneralService: SystemGeneralService,
  ) {
    this.restoreToken();
    this.addFormListeners();
  }

  private addFormListeners(): void {
    this.token.valueChanges.pipe(
      filter((token) => !!token),
      untilDestroyed(this),
    ).subscribe((token) => {
      this.category.enable();
      this.systemGeneralService.setTokenForJira(token);
    });
  }

  private restoreToken(): void {
    const token = this.systemGeneralService.getTokenForJira();
    if (token) {
      this.token.setValue(token);
      this.category.enable();
    } else {
      this.category.disable();
    }
  }

  getPayload(): Partial<CreateNewTicket> {
    return {
      category: this.category.value,
      title: this.title.value,
      token: this.token.value,
    };
  }
}
