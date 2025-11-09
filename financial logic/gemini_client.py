import json
import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, Dict, Optional, Sequence, Tuple

from dotenv import load_dotenv

try:  # pragma: no cover - optional dependency
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

load_dotenv()

MODULE_DIR = os.path.dirname(__file__)
PROMPTS_DIR = os.path.join(MODULE_DIR, "prompts")
_PROMPT_FILENAME = "gemini_suggestions_prompt.md"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.0-flash-lite-preview")
GEMINI_SYSTEM_PROMPT = os.getenv("GEMINI_SYSTEM_PROMPT")

_PROMPT_ENV_OVERRIDE = os.getenv("GEMINI_SUGGESTION_PROMPT")
if _PROMPT_ENV_OVERRIDE:
    DEFAULT_SUGGESTION_PROMPT = _PROMPT_ENV_OVERRIDE
else:
    default_prompt_candidates = [
        os.path.join(PROMPTS_DIR, _PROMPT_FILENAME),
        os.path.join(MODULE_DIR, _PROMPT_FILENAME),
    ]
    DEFAULT_SUGGESTION_PROMPT = next((p for p in default_prompt_candidates if os.path.exists(p)), default_prompt_candidates[-1])


class GeminiDependencyError(RuntimeError):
    """Raised when google-generativeai is missing."""


class GeminiConfigurationError(RuntimeError):
    """Raised when API credentials are missing."""


def _ensure_dependency() -> None:
    if genai is None:  # pragma: no cover - defensive
        raise GeminiDependencyError(
            "google-generativeai is not installed. Run `pip install google-generativeai` in your venv."
        )


def _ensure_api_key(override: Optional[str] = None) -> str:
    api_key = override or GEMINI_API_KEY
    if not api_key:
        raise GeminiConfigurationError(
            "Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY in your environment."
        )
    return api_key


def _default_generation_config() -> Dict[str, Any]:
    return {
        "temperature": float(os.getenv("GEMINI_TEMPERATURE", 0.7)),
        "top_p": float(os.getenv("GEMINI_TOP_P", 0.95)),
        "top_k": int(os.getenv("GEMINI_TOP_K", 32)),
        "max_output_tokens": int(os.getenv("GEMINI_MAX_TOKENS", 2048)),
    }


@dataclass
class GeminiClient:
    api_key: Optional[str] = None
    model_name: str = GEMINI_MODEL
    system_instruction: Optional[str] = GEMINI_SYSTEM_PROMPT
    generation_config: Dict[str, Any] = field(default_factory=_default_generation_config)
    safety_settings: Optional[Sequence[Dict[str, str]]] = None

    def __post_init__(self) -> None:
        _ensure_dependency()
        self.api_key = _ensure_api_key(self.api_key)
        genai.configure(api_key=self.api_key)
        self._model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=self.system_instruction,
            generation_config=self.generation_config,
            safety_settings=self.safety_settings,
        )

    # ------------------------------------------------------------------ #
    # Public helpers
    # ------------------------------------------------------------------ #
    def generate_text(self, prompt: str, **kwargs: Any) -> Tuple[str, Any]:
        """One-shot generation returning (text, raw_response)."""
        response = self._model.generate_content(prompt, **kwargs)
        return self._extract_text(response), response

    def start_chat(self, history: Optional[Sequence[Tuple[str, str]]] = None):
        """Create a chat session with optional history tuples of (role, message)."""
        chat_history = []
        if history:
            for role, message in history:
                chat_history.append({"role": role, "parts": [message]})
        return self._model.start_chat(history=chat_history)

    def send_chat_message(
        self,
        message: str,
        chat_session=None,
        stream: bool = False,
        **kwargs: Any,
    ):
        """
        Send a chat message. If `stream=True`, the streaming iterator is returned.
        Otherwise returns (text, raw_response).
        """
        session = chat_session or self.start_chat()
        response = session.send_message(message, stream=stream, **kwargs)
        if stream:
            return response
        return self._extract_text(response), response

    # ------------------------------------------------------------------ #
    # Internals
    # ------------------------------------------------------------------ #
    @staticmethod
    def _extract_text(response: Any) -> str:
        if response is None:
            return ""
        parts = []
        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            for part in getattr(content, "parts", []) or []:
                text = getattr(part, "text", None)
                if text:
                    parts.append(text)
        if not parts and callable(getattr(response, "text", None)):
            try:
                parts.append(response.text())
            except Exception:  # pragma: no cover - best-effort fallback
                pass
        return "\n".join(parts).strip()


_shared_client: Optional[GeminiClient] = None


def get_gemini_client(**overrides: Any) -> GeminiClient:
    """Return a cached GeminiClient (new one if overrides are supplied)."""
    global _shared_client
    if overrides:
        return GeminiClient(**overrides)
    if _shared_client is None:
        _shared_client = GeminiClient()
    return _shared_client


def ask_gemini(prompt: str, **kwargs: Any) -> str:
    """
    Convenience helper that returns only the text portion of a response.

    Example:
        reply = ask_gemini("Summarise the latest KPI updates.")
    """
    client = get_gemini_client()
    text, _ = client.generate_text(prompt, **kwargs)
    return text


def _resolve_prompt_path(path: str) -> str:
    candidate = os.path.expanduser(path)
    if not os.path.isabs(candidate):
        candidate = os.path.join(PROMPTS_DIR, candidate)
    return candidate


@lru_cache(maxsize=8)
def _load_prompt_text(path: str) -> str:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Prompt file not found: {path}")
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def build_suggestions_prompt(report: Dict[str, Any], prompt_path: Optional[str] = None) -> str:
    """Fill the suggestions prompt template with analytics output."""
    template_path = _resolve_prompt_path(prompt_path or DEFAULT_SUGGESTION_PROMPT)
    template = _load_prompt_text(template_path)
    context = {
        "summary": json.dumps(report.get("summary", {}), indent=2),
        "patterns": json.dumps(report.get("patterns", {}), indent=2),
        "recurring": json.dumps(report.get("recurring", []), indent=2),
        "anomalies": json.dumps(report.get("anomalies", []), indent=2),
        "top_saving_opportunities": json.dumps(
            report.get("summary", {}).get("top_saving_opportunities", []), indent=2
        ),
        "existing_suggestions": json.dumps(report.get("suggestions", []), indent=2),
    }
    return template.format(**context)


def generate_ai_suggestions(
    report: Dict[str, Any],
    prompt_path: Optional[str] = None,
    **generation_kwargs: Any,
) -> str:
    """
    Run the Gemini model against the structured report to get AI-written suggestions.

    Returns the raw text output (expected to be JSON). Callers can parse/validate separately.
    """
    prompt = build_suggestions_prompt(report, prompt_path=prompt_path)
    return ask_gemini(prompt, **generation_kwargs)


__all__ = [
    "GeminiClient",
    "GeminiConfigurationError",
    "GeminiDependencyError",
    "get_gemini_client",
    "ask_gemini",
    "build_suggestions_prompt",
    "generate_ai_suggestions",
]
