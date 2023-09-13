import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceExtraActionsComponent } from './service-extra-actions.component';

describe('ServiceExtraActionsComponent', () => {
  let component: ServiceExtraActionsComponent;
  let fixture: ComponentFixture<ServiceExtraActionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ServiceExtraActionsComponent],
    });
    fixture = TestBed.createComponent(ServiceExtraActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
