import re
from typing import Literal

import pandas as pd
from fastapi import HTTPException

from utils.session_store import get_session

TaskType = Literal["regression", "classification", "clustering"]
VALID_TASKS = ("regression", "classification", "clustering")

SESSION_NOT_FOUND = (
    "This session has expired or was deleted. Upload your dataset again to continue."
)


SESSION_NOT_FOUND_HEADERS = {"X-Error-Code": "session_not_found"}


def require_session(session_id: str) -> dict:
    session = get_session(session_id)
    if session is None:
        raise HTTPException(404, SESSION_NOT_FOUND, headers=SESSION_NOT_FOUND_HEADERS)
    return session


def active_df(session: dict) -> pd.DataFrame:
    return session["cleaned_df"] if session["cleaned_df"] is not None else session["df"]


_PATH_RE = re.compile(r"([A-Za-z]:\\[^\s'\"]+|(?:/[\w.\-]+){2,})")


def first_line(message: object, limit: int = 300) -> str:
    text = str(message).strip()
    text = text.splitlines()[0] if text else "Unknown error"
    return _PATH_RE.sub("[path]", text)[:limit]
