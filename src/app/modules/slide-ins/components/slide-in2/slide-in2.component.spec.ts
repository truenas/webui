import { A11yModule } from '@angular/cdk/a11y';
import { ElementRef, Renderer2 } from '@angular/core';
import {
  fakeAsync, discardPeriodicTasks, tick,
} from '@angular/core/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import {
  Subject, of,
} from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn2Component } from 'app/modules/slide-ins/components/slide-in2/slide-in2.component';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { ChainedComponentResponse, ChainedSlideInService } from 'app/services/chained-slide-in.service';

describe('IxSlideIn2Component', () => {
  const close$ = new Subject<ChainedComponentResponse>();
  let spectator: Spectator<SlideIn2Component>;
  const createComponent = createComponentFactory({
    component: SlideIn2Component,
    imports: [
      A11yModule,
    ],
    declarations: [
      MockComponent(SshConnectionFormComponent),
    ],
    providers: [

      mockProvider(ElementRef),
      mockProvider(Renderer2),
      mockProvider(ChainedSlideInService, {
        isTopComponentWide$: of(false),
        popComponent: jest.fn(),
        swapComponent: jest.fn(),
      }),
    ],
  });

  beforeAll(() => {
    Object.defineProperty(close$, 'next', {
      value: jest.fn(),
    });
    Object.defineProperty(close$, 'complete', {
      value: jest.fn(),
    });
  });

  function setupComponent(confirm: boolean): void {
    spectator = createComponent({
      providers: [
        mockProvider(DialogService, {
          confirm: jest.fn(() => of(confirm)),
        }),
      ],
      props: {
        componentInfo: {
          close$,
          component: SshConnectionFormComponent,
          id: 'id',
          data: undefined,
          isComponentAlive: true,
          wide: false,
        },
        index: 0,
        lastIndex: 0,
      },
    });
    jest.spyOn(console, 'error').mockImplementation();
    tick(10);
  }

  it('close slide-in when backdrop is clicked', fakeAsync(() => {
    setupComponent(true);
    const form = spectator.query(SshConnectionFormComponent);
    Object.defineProperty(form, 'requiresConfirmationOnClose', {
      value: undefined,
    });
    const backdrop = spectator.query('.ix-slide-in2-background');
    backdrop.dispatchEvent(new Event('click'));
    spectator.detectChanges();
    expect(close$.next).toHaveBeenCalledWith({ response: false, error: null });
    expect(close$.complete).toHaveBeenCalled();
    tick(305);
    expect(console.error).toHaveBeenCalledWith('Confirmation before closing form not defined');
    expect(spectator.inject(ChainedSlideInService).popComponent).toHaveBeenCalledWith('id');
    discardPeriodicTasks();
  }));

  it('opens the slide in component', fakeAsync(() => {
    setupComponent(true);
    const form = spectator.query(SshConnectionFormComponent);
    expect(form).toExist();
  }));

  it('shows confirmation when required', fakeAsync(() => {
    setupComponent(true);
    const form = spectator.query(SshConnectionFormComponent);
    jest.spyOn(form, 'requiresConfirmationOnClose').mockImplementation(() => of(true));
    const backdrop = spectator.query('.ix-slide-in2-background');
    backdrop.dispatchEvent(new Event('click'));
    spectator.detectChanges();
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to close?',
      cancelText: 'No',
      buttonText: 'Yes',
      buttonColor: 'red',
      hideCheckbox: true,
    });
    expect(close$.next).toHaveBeenCalledWith({ response: false, error: null });
    expect(close$.complete).toHaveBeenCalled();
    tick(305);
    expect(spectator.inject(ChainedSlideInService).popComponent).toHaveBeenCalledWith('id');
    discardPeriodicTasks();
  }));

  it('doesnt close slidein if confirmation is false', fakeAsync(() => {
    setupComponent(false);
    const form = spectator.query(SshConnectionFormComponent);
    jest.spyOn(form, 'requiresConfirmationOnClose').mockImplementation(() => of(true));
    const backdrop = spectator.query('.ix-slide-in2-background');
    backdrop.dispatchEvent(new Event('click'));
    spectator.detectChanges();
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to close?',
      cancelText: 'No',
      buttonText: 'Yes',
      buttonColor: 'red',
      hideCheckbox: true,
    });
    expect(close$.next).not.toHaveBeenCalled();
    expect(close$.complete).not.toHaveBeenCalled();
    tick(305);
    expect(spectator.inject(ChainedSlideInService).popComponent).not.toHaveBeenNthCalledWith(2);
    discardPeriodicTasks();
  }));
});
