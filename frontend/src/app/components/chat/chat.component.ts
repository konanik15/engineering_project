import {Component, Input, OnInit} from '@angular/core';
import {WebSocketSubject} from 'rxjs/webSocket';
import {LobbyDTO} from "../utils/dto";

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
  chatMessages: ChatMessageResponse[] = [];
  newMessage: string = '';


  @Input() socket: WebSocketSubject<any> | undefined;
  @Input() lobby!: LobbyDTO;


  // constructor(private lobbiesService: LobbiesService) {
  // }

  ngOnInit() {

    this.loadChatHistory()


    this.socket?.subscribe(
      (message) => {
        this.handleIncomingMessage(message);
      },
      (error) => {
        console.error('WebSocket error:', error);
      }
    );
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
      console.log("sending msg..")

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


}
