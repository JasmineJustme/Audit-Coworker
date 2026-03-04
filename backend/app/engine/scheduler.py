import math
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule import SchedulePlan, ScheduleTask
from app.models.settings import SystemSetting
from app.engine.executor import executor
from app.services.sse_manager import sse_manager
from loguru import logger


class SchedulerEngine:
    def __init__(self):
        self._circuit_breaker: dict[str, int] = {}  # agent_id -> consecutive failures

    async def run_tick(self, db: AsyncSession) -> None:
        """Main scheduler loop - called by APScheduler every minute"""
        # Check execution time window
        if not await self._in_time_window(db):
            return

        # Get max concurrency
        max_concurrent = await self._get_setting(db, "max_concurrency", 3)

        # Count currently running tasks
        running_q = select(ScheduleTask).where(ScheduleTask.status == "running")
        running = len((await db.execute(running_q)).scalars().all())

        available_slots = max_concurrent - running
        if available_slots <= 0:
            return

        # Get pending tasks ready to execute
        now = datetime.utcnow()
        pending_q = (
            select(ScheduleTask)
            .where(
                ScheduleTask.status == "pending",
                ScheduleTask.scheduled_at <= now,
            )
            .order_by(ScheduleTask.priority.desc(), ScheduleTask.scheduled_at)
            .limit(available_slots)
        )
        tasks = (await db.execute(pending_q)).scalars().all()

        for task in tasks:
            # Check dependencies
            if not await self._check_dependencies(db, task):
                continue

            # Check circuit breaker
            breaker_id = str(task.agent_id or task.wagent_id or "")
            if breaker_id and self._circuit_breaker.get(breaker_id, 0) >= 5:
                task.status = "blocked"
                await sse_manager.broadcast("circuit_breaker.triggered", {"task_id": task.id})
                continue

            # Check if needs confirmation
            needs_confirm = await self._needs_confirmation(db, task)
            if needs_confirm:
                task.status = "confirming"
                task.confirm_deadline = datetime.utcnow()
                await db.flush()
                await sse_manager.broadcast("task.confirm_required", {
                    "task_id": task.id,
                    "task_name": f"Task {task.id[:8]}",
                })
                continue

            # Execute
            await self._execute_task(db, task)

    async def _execute_task(self, db: AsyncSession, task: ScheduleTask) -> None:
        task.status = "running"
        task.started_at = datetime.utcnow()
        await db.flush()

        await sse_manager.broadcast("task.status_changed", {"task_id": task.id, "status": "running"})

        try:
            if task.agent_id:
                await executor.execute_agent(db, task)
            elif task.wagent_id:
                await executor.execute_wagent(db, task)

            if task.status == "completed":
                breaker_id = str(task.agent_id or task.wagent_id or "")
                if breaker_id:
                    self._circuit_breaker[breaker_id] = 0
                await sse_manager.broadcast("task.status_changed", {"task_id": task.id, "status": "completed"})
            else:
                await self._handle_failure(db, task)
        except Exception as e:
            logger.error(f"Task execution error: {e}")
            await self._handle_failure(db, task)

    async def _handle_failure(self, db: AsyncSession, task: ScheduleTask) -> None:
        breaker_id = str(task.agent_id or task.wagent_id or "")
        if breaker_id:
            self._circuit_breaker[breaker_id] = self._circuit_breaker.get(breaker_id, 0) + 1

        if task.retry_count < task.max_retries:
            task.retry_count += 1
            task.status = "retrying"
            # Exponential backoff
            delay_minutes = math.pow(2, task.retry_count - 1)
            task.scheduled_at = datetime.utcnow() + timedelta(minutes=delay_minutes)
            task.status = "pending"
        else:
            task.status = "failed"

        await db.flush()
        await sse_manager.broadcast("task.status_changed", {"task_id": task.id, "status": task.status})

    async def _check_dependencies(self, db: AsyncSession, task: ScheduleTask) -> bool:
        if not task.dependencies:
            return True
        dep_ids = task.dependencies if isinstance(task.dependencies, list) else []
        for dep_id in dep_ids:
            dep = await db.get(ScheduleTask, dep_id)
            if dep and dep.status != "completed":
                if dep.status == "failed":
                    task.status = "blocked"
                    await db.flush()
                return False
        return True

    async def _needs_confirmation(self, db: AsyncSession, task: ScheduleTask) -> bool:
        if task.agent_id:
            from app.models.agent import Agent
            agent = await db.get(Agent, task.agent_id)
            return agent.confirm_before_exec if agent else True
        if task.wagent_id:
            from app.models.wagent import WAgent
            wagent = await db.get(WAgent, task.wagent_id)
            return wagent.confirm_before_exec if wagent else True
        return True

    async def _in_time_window(self, db: AsyncSession) -> bool:
        # Simplified: always allow for now
        return True

    async def _get_setting(self, db: AsyncSession, key: str, default=None):
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalar_one_or_none()
        if not setting:
            return default
        val = setting.value
        if isinstance(val, dict) and "value" in val:
            return val["value"]
        return val if val is not None else default


scheduler_engine = SchedulerEngine()
