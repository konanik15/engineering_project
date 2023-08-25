import {Component, Input, OnInit} from '@angular/core';
import {HandDTO} from "../../../utils/dto";

@Component({
  selector: 'app-uno-player-hand',
  templateUrl: './uno-player-hand.component.html',
  styleUrls: ['./uno-player-hand.component.css']
})
export class UnoPlayerHandComponent implements OnInit{

  @Input() hand? : HandDTO;

  ngOnInit(): void {
    //console.log(this.hand)
  }



}
