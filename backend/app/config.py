from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str
    supabase_url: str
    supabase_service_role_key: str
    voyage_api_key: str | None = None

    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_host: str = "https://us.cloud.langfuse.com"

    claude_model: str = "claude-sonnet-4-6"
    voyage_model: str = "voyage-3-lite"
    retrieval_top_k: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
