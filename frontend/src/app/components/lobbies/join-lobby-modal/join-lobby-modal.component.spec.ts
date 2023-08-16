import {ComponentFixture, TestBed} from '@angular/core/testing';

import {JoinLobbyModalComponent} from './join-lobby-modal.component';

describe('JoinLobbyModalComponent', () => {
  let component: JoinLobbyModalComponent;
  let fixture: ComponentFixture<JoinLobbyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JoinLobbyModalComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(JoinLobbyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
