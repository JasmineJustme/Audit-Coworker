from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from fastapi import Request


async def log_action(
    db: AsyncSession,
    action: str,
    resource_type: str,
    resource_id: str = None,
    resource_name: str = None,
    details: dict = None,
    request: Request = None,
):
    ip = request.client.host if request and request.client else None
    log = AuditLog(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        resource_name=resource_name,
        details=details,
        ip_address=ip,
    )
    db.add(log)
    await db.flush()
