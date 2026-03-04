import httpx
from loguru import logger


class DifyClient:
    def __init__(self):
        self._client = httpx.AsyncClient(timeout=300)

    async def call_agent(self, endpoint: str, api_key: str, inputs: dict, timeout: int = 300) -> dict:
        """Call Dify Agent (Completion mode)"""
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"inputs": inputs, "response_mode": "blocking", "user": "audit-coworker"}
        try:
            response = await self._client.post(endpoint, json=payload, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Dify Agent call failed: {e}")
            raise

    async def call_workflow(self, endpoint: str, api_key: str, inputs: dict, timeout: int = 300) -> dict:
        """Call Dify Workflow"""
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"inputs": inputs, "response_mode": "blocking", "user": "audit-coworker"}
        try:
            response = await self._client.post(endpoint, json=payload, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Dify Workflow call failed: {e}")
            raise

    async def test_connection(self, endpoint: str, api_key: str) -> bool:
        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            base = endpoint.rstrip("/").rsplit("/", 1)[0]
            response = await self._client.get(
                f"{base}/parameters", headers=headers, timeout=10
            )
            return response.status_code == 200
        except Exception:
            return False

    async def close(self):
        await self._client.aclose()


dify_client = DifyClient()
