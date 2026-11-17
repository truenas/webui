/* eslint-disable max-classes-per-file */
import {
  ChangeDetectionStrategy, Component, Directive, signal, viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgControl } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { injectControlName } from 'app/modules/forms/ix-forms/utils/control-name.utils';

@Directive({ selector: 'input[ixControlNameProbe]' })
class ControlNameProbeDirective {
  readonly controlName = injectControlName(null);
}

@Component({
  selector: 'ix-control-name-host',
  template: '<input ixControlNameProbe [formField]="fields.ports[0]">',
  imports: [FormField, ControlNameProbeDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly probe = viewChild.required(ControlNameProbeDirective);
  readonly fields = form(signal({ ports: ['22'] }));
}

describe('injectControlName', () => {
  let spectator: Spectator<HostComponent>;
  const createComponent = createComponentFactory(HostComponent);

  it('skips a row index, so a control bound to a row is named after its list', () => {
    spectator = createComponent();
    expect(spectator.component.probe().controlName()).toBe('ports');
  });

  it('prefers the NgControl name when there is one', () => {
    spectator = createComponent();
    const name = TestBed.runInInjectionContext(() => injectControlName({ name: 'address' } as NgControl)());
    expect(name).toBe('address');
  });
});
