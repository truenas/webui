import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  templateUrl: './service-rsync.component.html',
})
export class ServiceRsyncComponent implements OnInit {
  activedTab = 'configure';
  navLinks = [{
    label: 'Configure',
    path: '/services/rsync/configure',
  },
  {
    label: 'Rsync Module',
    path: '/services/rsync/rsync-module',
  }];
  constructor(protected router: Router, protected aroute: ActivatedRoute) {}

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.activedTab = params['pk'];
    });
  }
}
