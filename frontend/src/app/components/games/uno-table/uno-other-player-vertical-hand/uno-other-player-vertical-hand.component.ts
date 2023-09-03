import {Component, Input} from '@angular/core';
import {HandDTO} from "../../../utils/dto";

@Component({
    selector: 'app-uno-other-player-vertical-hand',
    templateUrl: './uno-other-player-vertical-hand.component.html',
    styleUrls: ['./uno-other-player-vertical-hand.component.css']
})
export class UnoOtherPlayerVerticalHandComponent {
    @Input() hand?: HandDTO;
    @Input() isRight?: boolean;
}
