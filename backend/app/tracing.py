"""Langfuse tracing wrapper. No-ops cleanly if Langfuse keys aren't set,
so local dev and tests don't need a Langfuse account.

Langfuse v4 is OpenTelemetry-based; nested `start_as_current_observation`
calls produce parent/child spans automatically."""

from contextlib import contextmanager
from functools import lru_cache
from typing import Any

from app.config import get_settings


@lru_cache
def _get_client():
    s = get_settings()
    if not (s.langfuse_public_key and s.langfuse_secret_key):
        return None
    from langfuse import Langfuse

    return Langfuse(
        public_key=s.langfuse_public_key,
        secret_key=s.langfuse_secret_key,
        host=s.langfuse_host,
    )


class _NullSpan:
    """Matches the subset of LangfuseSpan/LangfuseGeneration that llm.py calls."""

    def update(self, **_: Any) -> None:
        pass


@contextmanager
def observation(
    name: str,
    as_type: str = "span",
    input: Any = None,
    model: str | None = None,
    model_parameters: dict | None = None,
    metadata: dict | None = None,
):
    """Context manager that yields a Langfuse span/generation if tracing
    is enabled, else a silent stub. Nesting works — child observations
    automatically attach to the enclosing parent."""
    client = _get_client()
    if client is None:
        yield _NullSpan()
        return

    kwargs: dict[str, Any] = {"name": name, "as_type": as_type}
    if input is not None:
        kwargs["input"] = input
    if model is not None:
        kwargs["model"] = model
    if model_parameters is not None:
        kwargs["model_parameters"] = model_parameters
    if metadata is not None:
        kwargs["metadata"] = metadata

    try:
        with client.start_as_current_observation(**kwargs) as obs:
            yield obs
    finally:
        client.flush()
