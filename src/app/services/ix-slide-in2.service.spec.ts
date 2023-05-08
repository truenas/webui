import { Location } from '@angular/common';
import { Component, ElementRef, Inject } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  createServiceFactory, mockProvider, SpectatorService, createComponentFactory, Spectator,
} from '@ngneat/spectator/jest';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxSlideIn2Component } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in2.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';

/** Simple component for testing IxSlideInComponent */
@Component({
  template: '<h1>{{text}}</h1>',
})
class TestComponent {
  text: string;
  constructor(
    public slideInRef: IxSlideInRef<DiskFormComponent, string>,
    @Inject(SLIDE_IN_DATA) private value: string,
  ) {
    this.text = value;
  }
  close(): void {
    this.slideInRef.close();
  }
}

describe('IxSlideIn2Service', () => {
  let spectator: SpectatorService<IxSlideIn2Service>;
  let service: IxSlideIn2Service;
  let spectatorComponent: Spectator<IxSlideIn2Component>;

  const createService = createServiceFactory({
    service: IxSlideIn2Service,
    providers: [
      Location,
      Router,
    ],
  });
  const createComponent = createComponentFactory({
    component: IxSlideIn2Component,
    providers: [
      mockProvider(ElementRef),
      IxSlideIn2Service,
    ],
  });

  beforeEach(() => {
    spectator = createService();
    service = spectator.service;
    spectatorComponent = createComponent({
      props: { id: 'ix-slide-in-form' },
    });
  });

  describe('slideInService', () => {
    it('the \'open\' method should return instance of IxSlideInRef', () => {
      jest.spyOn(service.slideIn2Component, 'openSlideIn');

      const instanceRef = service.open(TestComponent, { wide: true, data: 'Component created dynamically' });

      expect(service.slideIn2Component.openSlideIn).toHaveBeenCalledWith(TestComponent, { wide: true, data: 'Component created dynamically' });
      expect(instanceRef).toBeInstanceOf(IxSlideInRef);
    });

    it('should be call \'closeAll\' method after route navigation', async () => {
      jest.spyOn(service, 'closeAll');
      service.open(TestComponent);

      await spectator.inject(Router).navigate(['/']);

      expect(service.closeAll).toHaveBeenCalled();
    });

    it('should be call \'closeAll\' method after changing URL using location service', fakeAsync(() => {
      const location = spectator.inject(Location);
      location.go('/');
      jest.spyOn(service, 'closeAll');
      service.open(TestComponent, { wide: true, data: '' });

      location.back();
      tick(200);
      expect(service.closeAll).toHaveBeenCalled();
    }));
  });

  describe('IxSlideInRef', () => {
    it('should be passed the correct data to the dynamically created component after call \'open\'', () => {
      const slideInRef = service.open(TestComponent, { wide: true, data: 'Component created dynamically' });
      // check injected (SLIDE_IN_DATA)
      const componentInstance = slideInRef.componentInstance;

      expect(componentInstance.text).toBe('Component created dynamically');
    });

    it('should be injected IxSlideInRef to the dynamically created component after calling \'open\',', () => {
      const slideInRef = service.open(TestComponent, { wide: true, data: 'Component created dynamically' });
      // check injected SlideInRef

      expect(slideInRef.componentInstance.slideInRef).toBeInstanceOf(IxSlideInRef);
    });

    it('observable \'afterClosed$\' should emit response and close slide after call \'close\'', () => {
      jest.spyOn(spectatorComponent.component, 'closeSlideIn');
      const response = { error: true };
      const slideInRef = service.open(TestComponent);
      slideInRef.afterClosed$.subscribe((value) => {
        expect(value).toBe(response);
      });
      slideInRef.close();
      expect(spectatorComponent.component.closeSlideIn).toHaveBeenCalled();
    });
  });
});
