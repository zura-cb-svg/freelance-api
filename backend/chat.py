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
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            content = message_data.get("content")
            # ვაიძულებთ, რომ აუცილებლად ციფრად აღიქვას
            receiver_id = int(message_data.get("receiver_id"))

            new_message = models.Message(
                content=content,
                sender_id=user_id,
                receiver_id=receiver_id
            )
            db.add(new_message)
            db.commit()

            # ვაგზავნით მიმღებთან, თუ ონლაინაა
            await manager.send_personal_message(
                {"sender_id": user_id, "content": content}, 
                receiver_id
            )
    except Exception as e:
        print(f"WebSocket Error: {e}") # ეს ლოგებში დაგვანახებს პრობლემას
        manager.disconnect(user_id)

@router.get("/history/{user1_id}/{user2_id}")
def get_chat_history(user1_id: int, user2_id: int, db: Session = Depends(get_db)):
    # ვეძებთ მეორე იუზერის ნამდვილ სახელს
    other_user = db.query(models.User).filter(models.User.id == user2_id).first()
    name = other_user.full_name if other_user else f"User #{user2_id}"

    # მოგვაქვს ამ ორი იუზერის მიმოწერა
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == user1_id) & (models.Message.receiver_id == user2_id)) |
        ((models.Message.sender_id == user2_id) & (models.Message.receiver_id == user1_id))
    ).order_by(models.Message.id.asc()).all()

    return {
        "other_name": name,
        "messages": [{"sender_id": m.sender_id, "content": m.content} for m in messages]
    }


@router.get("/inbox/{user_id}")
def get_inbox(user_id: int, db: Session = Depends(get_db)):
    # მოგვაქვს ყველა მესიჯი, სადაც შენ ან გამგზავნი ხარ, ან მიმღები (ბოლოდან პირველისკენ)
    messages = db.query(models.Message).filter(
        (models.Message.sender_id == user_id) | (models.Message.receiver_id == user_id)
    ).order_by(models.Message.id.desc()).all()
    
    conversations = {}
    for msg in messages:
        # ვიგებთ მეორე იუზერის ID-ს
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        
        # თუ ეს იუზერი ჯერ არ დაგვიმატებია სიაში, ვამატებთ (რადგან უახლესი მესიჯები პირველი მოდის)
        if other_id not in conversations:
            other_user = db.query(models.User).filter(models.User.id == other_id).first()
            conversations[other_id] = {
                "user_id": other_id,
                "name": other_user.full_name if other_user else f"User #{other_id}",
                "last_message": msg.content
            }
            
    return list(conversations.values())