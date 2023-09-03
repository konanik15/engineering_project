import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DurakOtherPlayerVerticalHandComponent} from './durak-other-player-vertical-hand.component';

describe('DurakOtherPlayerVerticalHandComponent', () => {
    let component: DurakOtherPlayerVerticalHandComponent;
    let fixture: ComponentFixture<DurakOtherPlayerVerticalHandComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DurakOtherPlayerVerticalHandComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DurakOtherPlayerVerticalHandComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
