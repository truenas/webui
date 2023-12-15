import {
  Component,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import {
  CreateNewTicket,
} from 'app/modules/ix-feedback/interfaces/file-ticket.interface';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-form.component.html',
})
export class FileTicketFormComponent {
  title = new FormControl<string>('', [Validators.required]);
  readonly tooltips = {
    title: helptext.title.tooltip,
  };

  getPayload(): Partial<CreateNewTicket> {
    return {
      title: this.title.value,
    };
  }
}
