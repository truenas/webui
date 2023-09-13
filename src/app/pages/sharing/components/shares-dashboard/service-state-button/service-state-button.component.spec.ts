import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceStateButtonComponent } from './service-state-button.component';

describe('ServiceStateButtonComponent', () => {
  let component: ServiceStateButtonComponent;
  let fixture: ComponentFixture<ServiceStateButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceStateButtonComponent],
    });
    fixture = TestBed.createComponent(ServiceStateButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
