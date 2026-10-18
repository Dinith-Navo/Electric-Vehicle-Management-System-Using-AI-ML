import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from auth import decode_access_token

logger = logging.getLogger(__name__)

class StationWebSocketManager:
    def __init__(self):
        # Customers subscribed to public station availability
        self.customer_connections: Set[WebSocket] = set()
        # Authenticated station owners: ws -> user_dict
        self.owner_connections: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.customer_connections:
            self.customer_connections.remove(websocket)
        if websocket in self.owner_connections:
            del self.owner_connections[websocket]

    async def authenticate_or_subscribe(self, websocket: WebSocket, timeout_seconds: float = 5.0) -> bool:
        """
        Enforce first-message handshake:
        - {"type": "SUBSCRIBE_CUSTOMER"} -> Public customer subscription
        - {"type": "AUTH", "token": "Bearer <jwt>"} -> Authenticated owner connection
        Zero tokens in query string!
        """
        try:
            raw_data = await asyncio.wait_for(websocket.receive_text(), timeout=timeout_seconds)
            msg = json.loads(raw_data)
            msg_type = msg.get("type")

            if msg_type == "SUBSCRIBE_CUSTOMER":
                self.customer_connections.add(websocket)
                await websocket.send_json({
                    "type": "SUBSCRIBED",
                    "channel": "public_stations",
                    "message": "Subscribed to live station availability"
                })
                return True

            elif msg_type == "AUTH":
                raw_token = msg.get("token", "")
                if raw_token.startswith("Bearer "):
                    raw_token = raw_token[7:]
                
                try:
                    payload = decode_access_token(raw_token)
                    if payload.get("role") != "station_owner":
                        await websocket.send_json({
                            "type": "AUTH_ERROR",
                            "message": "Only station owners can authenticate on owner channel"
                        })
                        await websocket.close(code=4403)
                        return False
                    
                    self.owner_connections[websocket] = {
                        "userId": payload.get("sub"),
                        "email": payload.get("email"),
                        "role": payload.get("role")
                    }
                    await websocket.send_json({
                        "type": "AUTH_OK",
                        "ownerId": payload.get("sub"),
                        "message": "Authenticated as station owner"
                    })
                    return True
                except Exception as auth_err:
                    logger.warning(f"WebSocket auth failed: {auth_err}")
                    await websocket.send_json({
                        "type": "AUTH_ERROR",
                        "message": "Invalid or expired token"
                    })
                    await websocket.close(code=4401)
                    return False

            else:
                await websocket.send_json({
                    "type": "ERROR",
                    "message": "First message must be AUTH or SUBSCRIBE_CUSTOMER"
                })
                await websocket.close(code=4400)
                return False

        except asyncio.TimeoutError:
            logger.info("WebSocket handshake timed out")
            try:
                await websocket.send_json({
                    "type": "ERROR",
                    "message": "Handshake timed out"
                })
                await websocket.close(code=4408)
            except Exception:
                pass
            return False
        except Exception as e:
            logger.error(f"Error during WebSocket handshake: {e}")
            try:
                await websocket.close(code=4400)
            except Exception:
                pass
            return False

    async def broadcast_connector_update(
        self,
        station_id: str,
        connector_id: str,
        status: str,
        ports: list,
        timestamp: str
    ):
        """
        Broadcast sanitized minimal event to all subscribers.
        Omit owner IDs, secrets, and database internal identifiers.
        """
        payload = {
            "type": "CONNECTOR_STATUS_CHANGED",
            "stationId": station_id,
            "connectorId": connector_id,
            "status": status,
            "ports": ports,
            "timestamp": timestamp
        }

        dead_customers = set()
        for ws in self.customer_connections:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_customers.add(ws)

        for ws in dead_customers:
            self.customer_connections.discard(ws)

        dead_owners = set()
        for ws in self.owner_connections:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_owners.add(ws)

        for ws in dead_owners:
            self.owner_connections.pop(ws, None)

ws_manager = StationWebSocketManager()
