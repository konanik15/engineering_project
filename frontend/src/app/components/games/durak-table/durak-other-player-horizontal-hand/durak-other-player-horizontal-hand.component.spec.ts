import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DurakOtherPlayerHorizontalHandComponent} from './durak-other-player-horizontal-hand.component';

describe('DurakOtherPlayerHorizontalHandComponent', () => {
    let component: DurakOtherPlayerHorizontalHandComponent;
    let fixture: ComponentFixture<DurakOtherPlayerHorizontalHandComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DurakOtherPlayerHorizontalHandComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DurakOtherPlayerHorizontalHandComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
