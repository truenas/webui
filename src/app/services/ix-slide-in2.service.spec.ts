import { TestBed } from '@angular/core/testing';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';

describe('IxSlideIn2Service', () => {
  let service: IxSlideIn2Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IxSlideIn2Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
