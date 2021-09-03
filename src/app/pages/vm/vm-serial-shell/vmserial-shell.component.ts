import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { ShellService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-vmserial-shell',
  template: '<app-terminal [conf]="this"></app-terminal>',
})
export class VMSerialShellComponent implements TerminalConfiguration {
  protected pk: string;

  constructor(
    private aroute: ActivatedRoute,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.pk = params['pk'];
        subscriber.next();
      });
    });
  }

  setShellConnectionData(shellService: ShellService): void {
    shellService.vmId = Number(this.pk);
  }
}
