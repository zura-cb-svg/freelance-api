from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, json

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        await self.broadcast({"type": "status", "user_id": user_id, "is_online": True})

    async def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        await self.broadcast({"type": "status", "user_id": user_id, "is_online": False})

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            action = payload.get("type", "message")
            receiver_id = int(payload.get("receiver_id"))

            if action == "message":
                new_msg = models.Message(
                    content=payload.get("content"),
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    is_read=False
                )
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                await manager.send_personal_message({
                    "type": "message",
                    "id": new_msg.id,
                    "sender_id": user_id,
                    "content": new_msg.content,
                    "is_read": False
                }, receiver_id)

            elif action == "typing":
                await manager.send_personal_message({
                    "type": "typing",
                    "sender_id": user_id,
                    "is_typing": payload.get("is_typing", True)
                }, receiver_id)

            elif action == "read":
                db.query(models.Message).filter(
                    models.Message.sender_id == receiver_id,
                    models.Message.receiver_id == user_id,
                    models.Message.is_read == False
                ).update({"is_read": True})
                db.commit()
                
                await manager.send_personal_message({
                    "type": "read",
                    "reader_id": user_id
                }, receiver_id)

    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception as e:
        await manager.disconnect(user_id)

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
        "messages": [{"id": m.id, "sender_id": m.sender_id, "content": m.content, "is_read": m.is_read} for m in messages]
    }