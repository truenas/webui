import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormStatusComponent } from './form-status.component';

describe('FormStatusComponent', () => {
  let component: FormStatusComponent;
  let fixture: ComponentFixture<FormStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
