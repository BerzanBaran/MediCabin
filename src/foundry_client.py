"""Thin wrapper around the local Foundry Local daemon's OpenAI-compatible API."""

from __future__ import annotations

import json
import subprocess
import time

import openai

from . import config

_client: openai.OpenAI | None = None


class FoundryUnavailableError(RuntimeError):
    pass


def _run_foundry(args: list[str], timeout: int) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["foundry", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
    )


def _server_status() -> dict:
    result = _run_foundry(["server", "status", "--output", "json"], config.FOUNDRY_STARTUP_TIMEOUT_S)
    if result.returncode != 0:
        raise FoundryUnavailableError(result.stderr.strip() or "foundry server status failed")
    return json.loads(result.stdout)


def _ensure_server_running() -> str:
    try:
        status = _server_status()
    except (subprocess.SubprocessError, json.JSONDecodeError, FoundryUnavailableError):
        status = {"running": False}

    if not status.get("running") or not status.get("webUrls"):
        _run_foundry(["server", "start"], config.FOUNDRY_STARTUP_TIMEOUT_S)
        deadline = time.time() + config.FOUNDRY_STARTUP_TIMEOUT_S
        while time.time() < deadline:
            status = _server_status()
            if status.get("running") and status.get("webUrls"):
                break
            time.sleep(1)

    urls = status.get("webUrls") or []
    if not urls:
        raise FoundryUnavailableError("Foundry Local daemon has no web URL after start")
    return urls[0]


def ensure_model_loaded(alias: str) -> None:
    result = _run_foundry(["model", "load", alias], timeout=600)
    if result.returncode != 0:
        raise FoundryUnavailableError(result.stderr.strip() or f"foundry model load {alias} failed")


def get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        base_url = _ensure_server_running()
        _client = openai.OpenAI(base_url=f"{base_url}/v1", api_key="not-needed")
    return _client


def chat_complete(system: str, user: str, model: str = config.FOUNDRY_CHAT_MODEL_ALIAS) -> str:
    client = get_client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.1,
        max_tokens=400,
        frequency_penalty=0.4,
    )
    return response.choices[0].message.content or ""


def embed_texts(texts: list[str], model: str = config.FOUNDRY_EMBEDDING_MODEL_ALIAS) -> list[list[float]]:
    client = get_client()
    response = client.embeddings.create(model=model, input=texts)
    return [item.embedding for item in response.data]
