import { A11yModule } from '@angular/cdk/a11y';
import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, Inject,
} from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  createServiceFactory, mockProvider, SpectatorService, createComponentFactory, Spectator,
} from '@ngneat/spectator/jest';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInComponent } from 'app/modules/slide-ins/slide-in.component';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { SlideInService } from 'app/services/slide-in.service';

/** Simple component for testing IxSlideInComponent */
@Component({
  selector: 'ix-test',
  template: '<h1>{{text}}</h1>',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestComponent {
  text: string;
  constructor(
    public slideInRef: SlideInRef<DiskFormComponent, string>,
    @Inject(SLIDE_IN_DATA) private value: string,
  ) {
    this.text = value;
  }

  close(): void {
    this.slideInRef.close();
  }
}

describe('IxSlideInService', () => {
  let spectator: SpectatorService<SlideInService>;
  let service: SlideInService;
  let spectatorComponent: Spectator<SlideInComponent>;

  const createService = createServiceFactory({
    service: SlideInService,
    providers: [
      Location,
      Router,
    ],
  });
  const createComponent = createComponentFactory({
    component: SlideInComponent,
    providers: [
      mockProvider(ElementRef),
      SlideInService,
    ],
    imports: [
      A11yModule,
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
      jest.spyOn(service.slideInComponent, 'openSlideIn');

      const instanceRef = service.open(TestComponent, { wide: true, data: 'Component created dynamically' });

      expect(service.slideInComponent.openSlideIn).toHaveBeenCalledWith(TestComponent, { wide: true, data: 'Component created dynamically' });
      expect(instanceRef).toBeInstanceOf(SlideInRef);
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

      expect(slideInRef.componentInstance.slideInRef).toBeInstanceOf(SlideInRef);
    });

    it('after close slide observable \'slideInClosed$\' should emit response', () => {
      jest.spyOn(spectatorComponent.component, 'closeSlideIn');

      let response;
      const data = { value: true };
      const slideInRef = service.open(TestComponent);

      slideInRef.slideInClosed$.subscribe((val) => response = val);
      slideInRef.close(data);

      expect(response).toBe(data);
      expect(spectatorComponent.component.closeSlideIn).toHaveBeenCalled();
    });
  });
});
