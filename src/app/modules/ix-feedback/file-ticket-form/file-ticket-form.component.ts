import {
  Component,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import {
  filter,
} from 'rxjs/operators';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import {
  CreateNewTicket,
} from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-form.component.html',
})
export class FileTicketFormComponent {
  token = new FormControl<string>('', [Validators.required]);
  title = new FormControl<string>('', [Validators.required]);
  readonly tooltips = {
    token: helptext.token.tooltip,
    category: helptext.category.tooltip,
    title: helptext.title.tooltip,
  };

  constructor(
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
      this.systemGeneralService.setTokenForJira(token);
    });
  }

  private restoreToken(): void {
    const token = this.systemGeneralService.getTokenForJira();
    if (token) {
      this.token.setValue(token);
    }
  }

  getPayload(): Partial<CreateNewTicket> {
    return {
      title: this.title.value,
      token: this.token.value,
    };
  }
}
