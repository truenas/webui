import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscriber } from 'rxjs';
import { TerminalConfiguration } from 'app/interfaces/terminal.interface';
import { ShellService } from 'app/services/shell.service';

@UntilDestroy()
@Component({
  template: '<ix-terminal [conf]="this"></ix-terminal>',
})
export class VmSerialShellComponent implements TerminalConfiguration {
  protected pk: string;

  constructor(
    private aroute: ActivatedRoute,
  ) {}

  preInit(): Observable<void> {
    return new Observable<void>((subscriber: Subscriber<void>) => {
      this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
        this.pk = params['pk'] as string;
        subscriber.next();
      });
    });
  }

  setShellConnectionData(shellService: ShellService): void {
    shellService.vmId = Number(this.pk);
  }
}
