from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, json
import asyncio
from auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        self.active_connections.setdefault(user_id, set()).add(websocket)
        await self.broadcast({"type": "status", "user_id": user_id, "is_online": True})

    async def disconnect(self, user_id: int, websocket: WebSocket):
        connections = self.active_connections.get(user_id, set())
        connections.discard(websocket)
        if not connections:
            self.active_connections.pop(user_id, None)
            await self.broadcast({"type": "status", "user_id": user_id, "is_online": False})

    async def send_personal_message(self, message: dict, user_id: int):
        for connection in tuple(self.active_connections.get(user_id, set())):
            try:
                await connection.send_json(message)
            except Exception:
                await self.disconnect(user_id, connection)

    async def broadcast(self, message: dict):
        for connections in tuple(self.active_connections.values()):
            for connection in tuple(connections):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        credentials = await asyncio.wait_for(websocket.receive_json(), timeout=10)
        if credentials.get("type") != "authenticate":
            raise HTTPException(status_code=401)
        user = get_current_user(token=credentials.get("token", ""), db=db)
        if user.id != user_id or not user.is_active:
            raise HTTPException(status_code=403)
    except (HTTPException, asyncio.TimeoutError, ValueError, AttributeError):
        await websocket.close(code=1008)
        return
    await manager.connect(websocket, user_id)
    await websocket.send_json({"type": "authenticated"})
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            action = payload.get("type", "message")
            try:
                receiver_id = int(payload.get("receiver_id"))
            except (TypeError, ValueError):
                await websocket.send_json({"type": "error", "message": "Invalid recipient."})
                continue
            if not db.query(models.User).filter(models.User.id == receiver_id, models.User.is_active == True).first():
                await websocket.send_json({"type": "error", "message": "Recipient unavailable."})
                continue

            if action == "message":
                content = payload.get("content")
                if not isinstance(content, str) or not content.strip() or len(content) > 4000:
                    await websocket.send_json({"type": "error", "message": "Use 1–4000 characters."})
                    continue
                new_msg = models.Message(
                    content=content.strip(),
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    is_read=False
                )
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                message = {
                    "type": "message",
                    "id": new_msg.id,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": new_msg.content,
                    "is_read": False
                }
                await manager.send_personal_message(message, receiver_id)
                await websocket.send_json(message)

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
        await manager.disconnect(user_id, websocket)
    except Exception as e:
        await manager.disconnect(user_id, websocket)

@router.get("/inbox/{user_id}")
def get_inbox(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own inbox")
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
def get_chat_history(user1_id: int, user2_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if user1_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own conversations")
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