from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json
from database import get_db
import models

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        online_user_ids = list(self.active_connections)
        self.active_connections[user_id] = websocket
        await self.broadcast({"type": "status", "user_id": user_id, "is_online": True})
        for online_user_id in online_user_ids:
            await websocket.send_json({
                "type": "status",
                "user_id": online_user_id,
                "is_online": True,
            })

    async def disconnect(self, user_id: int, websocket: WebSocket | None = None):
        if websocket is None or self.active_connections.get(user_id) is websocket:
            self.active_connections.pop(user_id, None)
            await self.broadcast({"type": "status", "user_id": user_id, "is_online": False})

    async def send_personal_message(self, message: dict, user_id: int):
        connection = self.active_connections.get(user_id)
        if connection:
            try:
                await connection.send_json(message)
            except Exception:
                await self.disconnect(user_id, connection)

    async def broadcast(self, message: dict):
        for user_id, connection in list(self.active_connections.items()):
            try:
                await connection.send_json(message)
            except Exception:
                await self.disconnect(user_id, connection)

manager = ConnectionManager()

@router.get("/test")
def test_chat():
    return {"message": "Chat is active and WebSocket is ready!"}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            payload = json.loads(await websocket.receive_text())
            action = payload.get("type", "message")
            receiver_id = int(payload.get("receiver_id"))

            if action == "message":
                new_message = models.Message(
                    content=payload.get("content", ""),
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    is_read=False,
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)
                await manager.send_personal_message({
                    "type": "message",
                    "id": new_message.id,
                    "sender_id": user_id,
                    "content": new_message.content,
                    "is_read": new_message.is_read,
                }, receiver_id)
            elif action == "typing":
                await manager.send_personal_message({
                    "type": "typing",
                    "sender_id": user_id,
                    "is_typing": payload.get("is_typing", True),
                }, receiver_id)
            elif action == "read":
                db.query(models.Message).filter(
                    models.Message.sender_id == receiver_id,
                    models.Message.receiver_id == user_id,
                    models.Message.is_read.is_(False),
                ).update({"is_read": True}, synchronize_session=False)
                db.commit()
                await manager.send_personal_message({"type": "read", "reader_id": user_id}, receiver_id)
    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)
    except Exception as error:
        print(f"WebSocket Error: {error}")
        await manager.disconnect(user_id, websocket)

@router.get("/history/{user1_id}/{user2_id}")
def get_chat_history(user1_id: int, user2_id: int, db: Session = Depends(get_db)):
    other_user = db.query(models.User).filter(models.User.id == user2_id).first()
    name = other_user.full_name if other_user else f"User #{user2_id}"

    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == user1_id) & (models.Message.receiver_id == user2_id)) |
        ((models.Message.sender_id == user2_id) & (models.Message.receiver_id == user1_id))
    ).order_by(models.Message.id.asc()).all()

    return {
        "other_name": name,
        "messages": [{
            "id": message.id,
            "sender_id": message.sender_id,
            "content": message.content,
            "is_read": message.is_read,
        } for message in messages]
    }


@router.get("/inbox/{user_id}")
def get_inbox(user_id: int, db: Session = Depends(get_db)):
    messages = db.query(models.Message).filter(
        (models.Message.sender_id == user_id) | (models.Message.receiver_id == user_id)
    ).order_by(models.Message.id.desc()).all()
    
    conversations = {}
    for msg in messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if other_id not in conversations:
            other_user = db.query(models.User).filter(models.User.id == other_id).first()
            conversations[other_id] = {
                "user_id": other_id,
                "name": other_user.full_name if other_user else f"User #{other_id}",
                "last_message": msg.content
            }
            
    return list(conversations.values())