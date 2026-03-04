from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Agent, WAgent, Workflow, Todo
from app.services.llm_client import llm_client
from loguru import logger
import json


class Orchestrator:
    async def orchestrate(self, db: AsyncSession, todo_ids: list[str]) -> dict:
        """Analyze todos and create orchestration plan using LLM"""
        # 1. Get todos
        result = await db.execute(select(Todo).where(Todo.id.in_(todo_ids)))
        todos = result.scalars().all()
        if not todos:
            return {"error": "No todos found"}

        # 2. Get available agents and wagents
        agents_result = await db.execute(select(Agent).where(Agent.is_enabled == True))
        agents = agents_result.scalars().all()
        wagents_result = await db.execute(select(WAgent).where(WAgent.is_enabled == True))
        wagents = wagents_result.scalars().all()
        workflows_result = await db.execute(select(Workflow).where(Workflow.is_enabled == True))
        workflows = workflows_result.scalars().all()

        # 3. Get LLM config for orchestration
        from app.models.llm_config import LLMConfig
        llm_result = await db.execute(select(LLMConfig).where(LLMConfig.purpose == "orchestration"))
        llm_config = llm_result.scalar_one_or_none()

        if not llm_config:
            # Return a mock plan when no LLM configured
            return self._create_mock_plan(todos, agents, wagents)

        # 4. Build prompt
        todo_desc = "\n".join([f"- {t.title}: {t.description or ''}" for t in todos])
        agent_desc = "\n".join([f"- {a.name} (tags: {a.capability_tags}): {a.description or ''}" for a in agents])
        wagent_desc = "\n".join([f"- {w.name} (tags: {w.capability_tags}): {w.description or ''}" for w in wagents])

        prompt = llm_config.prompt_template.format(
            todos=todo_desc, agents=agent_desc, wagents=wagent_desc
        ) if "{todos}" in (llm_config.prompt_template or "") else f"""
分析以下待办任务，从可用的Agent和W-Agent中选择最佳方案来完成任务。
待办任务：
{todo_desc}

可用Agent：
{agent_desc}

可用W-Agent：
{wagent_desc}

请返回JSON格式的编排方案，包含：plan_type(agent/wagent/new_wagent), recommended_id, reason, input_params, priority, estimated_duration_minutes
"""

        # 5. Call LLM
        try:
            response = await llm_client.chat(llm_config, [
                {"role": "system", "content": "你是一个智能任务编排助手。"},
                {"role": "user", "content": prompt}
            ])
            await llm_client.log_usage(db, "orchestration", llm_config.model_name, response.get("usage", {}))

            # Parse response
            content = response.get("content", "")
            try:
                plan = json.loads(content)
            except json.JSONDecodeError:
                plan = {"plan_type": "agent", "reason": content}

            return {
                "status": "pending_confirm",
                "plan": plan,
                "todo_ids": todo_ids,
                "llm_reason": plan.get("reason", content),
            }
        except Exception as e:
            logger.error(f"Orchestration LLM call failed: {e}")
            return self._create_mock_plan(todos, agents, wagents)

    def _create_mock_plan(self, todos, agents, wagents):
        """Create a simple mock plan when LLM is not available"""
        recommended = agents[0] if agents else (wagents[0] if wagents else None)
        if not recommended:
            return {"status": "failed", "error": "No agents or W-Agents available"}

        is_agent = isinstance(recommended, Agent) if hasattr(recommended, '__class__') else True
        return {
            "status": "pending_confirm",
            "plan": {
                "plan_type": "agent" if is_agent else "wagent",
                "recommended_id": recommended.id,
                "recommended_name": recommended.name,
                "reason": f"推荐使用 {recommended.name} 处理此任务",
                "priority": "medium",
                "estimated_duration_minutes": 30,
            },
            "todo_ids": [t.id for t in todos],
            "llm_reason": f"推荐使用 {recommended.name} 处理此任务",
        }


orchestrator = Orchestrator()
