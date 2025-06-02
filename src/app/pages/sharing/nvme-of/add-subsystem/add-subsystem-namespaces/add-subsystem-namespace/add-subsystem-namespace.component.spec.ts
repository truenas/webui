import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSubsystemNamespaceComponent } from './add-subsystem-namespace.component';

describe('AddSubsystemNamespaceComponent', () => {
  let component: AddSubsystemNamespaceComponent;
  let fixture: ComponentFixture<AddSubsystemNamespaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSubsystemNamespaceComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddSubsystemNamespaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
