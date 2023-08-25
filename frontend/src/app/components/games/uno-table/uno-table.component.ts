import {Component, Input, OnInit} from '@angular/core';
import {GameDTO, HandDTO} from "../../utils/dto";
import {OAuthService} from "angular-oauth2-oidc";


//TODO Create abstract table component
@Component({
  selector: 'app-uno-table',
  templateUrl: './uno-table.component.html',
  styleUrls: ['./uno-table.component.css']
})
export class UnoTableComponent implements OnInit{
  @Input() gameSocket: any;
  @Input() game?: GameDTO;

  playerHand!: HandDTO;
  enemiesHands: HandDTO[] = [];

  username: string = "";

  constructor(private oAuthService: OAuthService) {
  }

  ngOnInit(): void {
    const userClaims: any = this.oAuthService.getIdentityClaims();
    this.username = userClaims.family_name ? userClaims.family_name : "Anonim";

    if(this.game?.state?.hands) {
      this.setPlayerHand(this.game.state.hands)
      this.setEnemiesHands(this.game.state.hands)
    }

    this.gameSocket.subscribe(
      // @ts-ignore
      msg => this.handleMessage(msg),
      // @ts-ignore // TODO Better error handling ;)
      err => console.log(err),
      () => console.log('Closing WS connection to Lobby')
    )
  }



  private handleMessage(message: any) {
    switch (message.type) {

      case "lateJoined":

      case "playerJoined":
      case "newMessage":
      case "playerReady":
      case "playerUnready":
      case "joinResult":
      case "gameEnded":
      case "startGameResult":
      case "readyResult":
        console.log("Handling ws message from GameService", (message.type))
        break;

      default: {
        console.log("Wrong message type:", message.type)
        break;
      }
    }
  }

  private setPlayerHand(hands: HandDTO[]) {
    this.playerHand = <HandDTO>hands.find(hand => {
      return hand.owner === this.username;
    })
  }

  private setEnemiesHands(hands: HandDTO[]) {
    hands.forEach(hand => {
      if(hand.owner !== this.username && hand) {
        this.enemiesHands.push(hand)
      }
    })
  }
}
