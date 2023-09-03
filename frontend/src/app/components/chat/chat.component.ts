import {Component, Input, OnInit} from '@angular/core';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';
import {LobbyDTO} from "../utils/dto";
import {SharedUrls} from "../utils/shared-urls";
import {OAuthService} from "angular-oauth2-oidc";
import {SocialService} from "../utils/social-service";

interface ChatMessage {
  "type": "chatMessage"
  "data": {
    "message": string;
  };
}

interface ChatMessageResponse {
  "type": "newMessage",
  "data": {
    "message": {
      "sender": string,
      "message": string,
      "timestamp": Date
    }
  }
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @Input() socket?: WebSocketSubject<any>;
  @Input() lobby!: LobbyDTO;

  chatMessages: ChatMessageResponse[] = [];
  newMessage: string = '';

  constructor(private oAuthService: OAuthService,
              private socialService: SocialService) {
  }

  ngOnInit() {
    if (this.lobby) {
      this.loadChatHistory()
    }


    this.socket?.subscribe(
        (message) => {
          this.handleIncomingMessage(message);
        },
        (error) => {
          console.error('WebSocket error:', error);
        }
    );

    if (!this.socket) {
      this.establishWSConnection(this.lobby).subscribe(
          (message) => {
            this.handleIncomingMessage(message);
          },
          (error) => {
            console.error('WebSocket error:', error);
          }
      )
    }
  }

  private handleIncomingMessage(chatMessageResponse: any) {
    if (chatMessageResponse.type && chatMessageResponse.data.message && chatMessageResponse.type === "newMessage") {
      const newChatMessage: ChatMessageResponse = {
        type: chatMessageResponse.type,
        data: {
          message: {
            sender: chatMessageResponse.data.message.sender,
            message: chatMessageResponse.data.message.message,
            timestamp: chatMessageResponse.data.message.timestamp
          }
        }
      };
      this.chatMessages.push(newChatMessage);
    }
  }

  sendMessage() {
    if (this.newMessage.trim() !== '') {
      const newChatMessage: ChatMessage = {
        type: "chatMessage",
        data: {
          message: this.newMessage
        }
      };

      this.socket?.next(newChatMessage);
      this.newMessage = '';
    }
  }

  private loadChatHistory() {
    this.lobby.chatHistory?.forEach(message => {
      this.chatMessages.push({
        "type": "newMessage",
        "data": {
          "message": {
            "sender": message.sender,
            "message": message.message,
            "timestamp": message.timestamp
          }
        }
      })
    })
  }


  private establishWSConnection(lobby: LobbyDTO) {
    console.log('Connecting to social via WS')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let url = (`ws://${SharedUrls.SOCIAL_SERVER}/${SharedUrls.CHAT}/${SharedUrls.LOBBY}/${<string>localStorage.getItem('lobbyID')}${tokenQuery}`)


    return this.socialService.socialSocket = webSocket(url);
  }
}
