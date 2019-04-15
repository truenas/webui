import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnclosureDisksComponent } from './enclosure-details.component';

describe('EnclosureDisksComponent', () => {
  let component: EnclosureDisksComponent;
  let fixture: ComponentFixture<EnclosureDisksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnclosureDisksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnclosureDisksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
