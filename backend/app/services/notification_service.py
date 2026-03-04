from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.message import Message
from app.models.notification_channel import NotificationChannel
from app.models.notification_pref import NotificationPref, NotificationGlobalPref
from app.services.sse_manager import sse_manager
from app.services.dify_client import dify_client
from loguru import logger
from datetime import datetime


class NotificationService:
    async def notify(
        self,
        db: AsyncSession,
        msg_type: str,
        title: str,
        content: str,
        related_type: str = None,
        related_id: str = None,
        action_url: str = None,
    ):
        """Create a notification and broadcast via SSE + external channels"""
        # 1. Create message record
        msg = Message(
            type=msg_type,
            title=title,
            content=content,
            related_type=related_type,
            related_id=related_id,
            action_url=action_url,
        )
        db.add(msg)
        await db.flush()

        # 2. Broadcast via SSE
        event_type = msg_type  # Use message type as SSE event
        await sse_manager.broadcast(event_type, {
            "id": msg.id,
            "type": msg_type,
            "title": title,
            "content": content,
            "action_url": action_url,
        })

        # 3. Check user preferences and send external notifications
        prefs_q = select(NotificationPref).where(
            NotificationPref.message_type == msg_type,
            NotificationPref.user_id == "default"
        )
        pref = (await db.execute(prefs_q)).scalar_one_or_none()

        # Check DND
        global_q = select(NotificationGlobalPref).where(NotificationGlobalPref.user_id == "default")
        global_pref = (await db.execute(global_q)).scalar_one_or_none()

        if global_pref and global_pref.dnd_start and global_pref.dnd_end:
            now_time = datetime.utcnow().strftime("%H:%M")
            if global_pref.dnd_start <= now_time <= global_pref.dnd_end:
                logger.info(f"DND active, skipping external push for {msg_type}")
                return msg

        if pref:
            if pref.email_enabled:
                await self._push_external(db, "email_workflow", title, content)
                msg.external_pushed = True
            if pref.wechat_enabled:
                await self._push_external(db, "wechat_workflow", title, content)
                msg.external_pushed = True

        await db.flush()
        return msg

    async def _push_external(self, db: AsyncSession, channel_type: str, title: str, content: str):
        """Push notification via Dify Workflow"""
        channel_q = select(NotificationChannel).where(
            NotificationChannel.channel_type == channel_type,
            NotificationChannel.is_enabled == True
        )
        channel = (await db.execute(channel_q)).scalar_one_or_none()
        if not channel:
            return

        try:
            mapping = channel.input_mapping or {}
            inputs = {}
            for key, field in mapping.items():
                if "subject" in key.lower() or "title" in key.lower():
                    inputs[field] = title
                elif "content" in key.lower() or "body" in key.lower() or "message" in key.lower():
                    inputs[field] = content
                else:
                    inputs[field] = content

            await dify_client.call_workflow(channel.dify_endpoint, channel.dify_api_key, inputs)
            logger.info(f"External notification sent via {channel_type}")
        except Exception as e:
            logger.error(f"External notification failed ({channel_type}): {e}")


notification_service = NotificationService()
