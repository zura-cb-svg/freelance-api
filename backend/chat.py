from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict
import json
from database import get_db
import models

router = APIRouter(prefix="/chat", tags=["Chat"])

# 1. Connection Manager (ინახავს ონლაინ იუზერებს რეალურ დროში)
class ConnectionManager:
    def __init__(self):
        # ლექსიკონი, სადაც ვინახავთ: {user_id: websocket_connection}
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        # თუ მომხმარებელი ონლაინაა, ვუგზავნით მესიჯს ეგრევე
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# 2. ეს არის ის "სატესტო" ენდპოინტი, რასაც შენი ფრონტენდი ელოდება
@router.get("/test")
def test_chat():
    return {"message": "Chat is active and WebSocket is ready!"}

# 3. მთავარი ჩატის (WebSocket) ენდპოინტი
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # ველოდებით მესიჯს ფრონტენდიდან
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            content = message_data.get("content")
            receiver_id = message_data.get("receiver_id")

            # ვინახავთ მესიჯს PostgreSQL ბაზაში
            new_message = models.Message(
                content=content,
                sender_id=user_id,
                receiver_id=receiver_id
            )
            db.add(new_message)
            db.commit()
            db.refresh(new_message)

            # ვუგზავნით მიმღებს (თუ საიტზე შემოსულია)
            if receiver_id:
                await manager.send_personal_message(
                    {"sender_id": user_id, "content": content}, 
                    receiver_id
                )
    except WebSocketDisconnect:
        manager.disconnect(user_id)