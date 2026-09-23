from typing import List

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from routers.common import SESSION_NOT_FOUND, SESSION_NOT_FOUND_HEADERS
from utils.session_store import delete_session, is_valid_session_id, session_summary

router = APIRouter()

MAX_BATCH = 50


class SessionIds(BaseModel):
    ids: List[str] = Field(default_factory=list, max_length=MAX_BATCH)


@router.post("/status")
def sessions_status(body: SessionIds):
    return {"sessions": {sid: session_summary(sid) for sid in dict.fromkeys(body.ids)}}


@router.post("/delete")
def delete_sessions(body: SessionIds):
    deleted = sum(1 for sid in dict.fromkeys(body.ids) if delete_session(sid))
    return {"deleted": deleted}


@router.get("/{session_id}")
def get_session_info(session_id: str):
    summary = session_summary(session_id)
    if summary is None:
        raise HTTPException(404, SESSION_NOT_FOUND, headers=SESSION_NOT_FOUND_HEADERS)
    return summary


@router.delete("/{session_id}", status_code=204)
def remove_session(session_id: str):
    if not is_valid_session_id(session_id):
        raise HTTPException(400, "That session ID isn't valid.")
    delete_session(session_id)
    return Response(status_code=204)
