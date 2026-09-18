from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List
from sqlalchemy.orm import Session
from database import get_db
from models import Message
from fastapi.responses import HTMLResponse

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: int,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            new_msg = Message(content=data, sender_id=client_id)
            db.add(new_msg)
            db.commit()
            await manager.broadcast(f"Client #{client_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{client_id} left the chat")

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Live Chat</title>
    </head>
    <body>
        <h2>Freelance Chat</h2>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off" placeholder="Enter a message..."/>
            <button>Send</button>
        </form>
        <ul id='messages'></ul>
        
        <script>
            var client_id = Math.floor(Math.random() * 1000);
            var ws = new WebSocket("ws://localhost:88/chat/ws/" + client_id);

            ws.onmessage = function(event) {
                var messages = document.getElementById('messages');
                var message = document.createElement('li');
                var content = document.createTextNode(event.data);
                message.appendChild(content);
                messages.appendChild(message);
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText");
                ws.send(input.value);
                input.value = '';
                event.preventDefault();
            }
        </script>
    </body>
</html>
"""

@router.get("/test")
async def get_test_chat():
    return HTMLResponse(html)