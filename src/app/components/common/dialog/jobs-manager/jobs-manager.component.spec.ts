import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { WebSocketService } from 'app/services/ws.service';
import { JobsManagerComponent } from './jobs-manager.component';

describe('JobsManagerComponent', () => {
  let component: JobsManagerComponent;
  let fixture: ComponentFixture<JobsManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [WebSocketService],
      declarations: [JobsManagerComponent],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
