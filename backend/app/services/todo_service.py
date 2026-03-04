from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.todo import Todo


class TodoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_todos(self, status=None, priority=None, source=None, page=1, size=20, sort="created_at"):
        query = select(Todo).where(Todo.user_id == "default")
        if status:
            query = query.where(Todo.status == status)
        if priority:
            query = query.where(Todo.priority == priority)
        if source:
            query = query.where(Todo.source == source)
        # count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0
        # paginate
        query = query.order_by(Todo.created_at.desc()).offset((page - 1) * size).limit(size)
        result = await self.db.execute(query)
        items = result.scalars().all()
        return {"items": items, "total": total, "page": page, "size": size, "pages": (total + size - 1) // size}

    async def create_todo(self, data: dict) -> Todo:
        todo = Todo(**data, source=data.get("source", "manual"))
        self.db.add(todo)
        await self.db.flush()
        return todo

    async def get_todo(self, todo_id: str) -> Todo | None:
        result = await self.db.execute(select(Todo).where(Todo.id == todo_id))
        return result.scalar_one_or_none()

    async def update_todo(self, todo_id: str, data: dict) -> Todo | None:
        todo = await self.get_todo(todo_id)
        if not todo:
            return None
        for key, value in data.items():
            if value is not None:
                setattr(todo, key, value)
        await self.db.flush()
        return todo

    async def delete_todo(self, todo_id: str) -> bool:
        todo = await self.get_todo(todo_id)
        if not todo:
            return False
        await self.db.delete(todo)
        return True

    async def get_review_pending(self):
        result = await self.db.execute(
            select(Todo).where(
                Todo.review_status == "pending_review",
                Todo.user_id == "default",
            )
        )
        return result.scalars().all()

    async def confirm_review(self, todo_id: str, updates: dict = None):
        todo = await self.get_todo(todo_id)
        if not todo:
            return None
        if updates:
            for k, v in updates.items():
                if v is not None:
                    setattr(todo, k, v)
        todo.review_status = "confirmed"
        todo.status = "pending"
        await self.db.flush()
        return todo

    async def reject_review(self, todo_id: str):
        todo = await self.get_todo(todo_id)
        if not todo:
            return None
        todo.review_status = "rejected"
        await self.db.flush()
        return todo
