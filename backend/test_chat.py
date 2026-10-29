"""Chat access and delivery tests use an isolated SQLite database only."""
import os
import sys
from pathlib import Path

os.environ['DATABASE_URL'] = 'sqlite://'
os.environ['SECRET_KEY'] = 'test-only-key-not-used-in-deployment'
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.websockets import WebSocketDisconnect
import chat
import models
from database import Base, get_db
from security import create_access_token

@pytest.fixture
def client():
    engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        db.add_all([models.User(id=i, full_name=f'Test {i}', email=f'test{i}@example.invalid', role='client', is_active=True) for i in (1, 2, 3)])
        db.commit()
    def isolated_db():
        with sessions() as db:
            yield db
    app = FastAPI()
    app.include_router(chat.router)
    app.dependency_overrides[get_db] = isolated_db
    chat.manager.active_connections.clear()
    with TestClient(app) as value:
        yield value
    engine.dispose()

def headers(user_id):
    return {'Authorization': f'Bearer {create_access_token({"sub": str(user_id)})}'}

def authenticate(ws, user_id):
    ws.send_json({'type': 'authenticate', 'token': create_access_token({'sub': str(user_id)})})
    while ws.receive_json()['type'] != 'authenticated':
        pass

def test_history_and_inbox_require_owner(client):
    assert client.get('/chat/inbox/1').status_code == 401
    assert client.get('/chat/history/1/2').status_code == 401
    assert client.get('/chat/inbox/1', headers=headers(2)).status_code == 403
    assert client.get('/chat/history/1/2', headers=headers(3)).status_code == 403
    assert client.get('/chat/inbox/1', headers=headers(1)).json() == []

def test_websocket_rejects_impersonation(client):
    with client.websocket_connect('/chat/ws/1') as ws:
        ws.send_json({'type': 'authenticate', 'token': create_access_token({'sub': '2'})})
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_json()
        assert exc.value.code == 1008

def test_delivery_validation_and_persistence(client):
    with client.websocket_connect('/chat/ws/1') as ws:
        authenticate(ws, 1)
        ws.send_json({'receiver_id': 2, 'content': '   '})
        assert ws.receive_json()['type'] == 'error'
        ws.send_json({'receiver_id': 'invalid', 'content': 'test'})
        assert ws.receive_json()['type'] == 'error'
        ws.send_json({'receiver_id': 2, 'sender_id': 3, 'content': 'Hello from test 1'})
        message = ws.receive_json()
        assert message['type'] == 'message'
        assert message['sender_id'] == 1
        assert message['receiver_id'] == 2
        history = client.get('/chat/history/2/1', headers=headers(2)).json()
        assert history['messages'][0]['id'] == message['id']
        assert history['messages'][0]['content'] == 'Hello from test 1'
    with client.websocket_connect('/chat/ws/2') as ws:
        authenticate(ws, 2)
        ws.send_json({'type': 'read', 'receiver_id': 1})
        ws.send_json({'receiver_id': 1, 'content': 'Reply'})
        assert ws.receive_json()['content'] == 'Reply'
    assert client.get('/chat/history/1/2', headers=headers(1)).json()['messages'][0]['is_read'] is True
