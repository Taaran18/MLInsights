import io
import json
import os
import re
import zipfile
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from routers.common import active_df, require_session
from utils.data_utils import get_basic_info, get_missing_info
from utils.report_gen import generate_report
from utils.session_store import get_meta_path, get_session_dir

router = APIRouter()


def _base_name(filename: str) -> str:
    return filename.rsplit(".", 1)[0] or "dataset"


def _attachment(filename: str) -> dict:
    ascii_name = re.sub(r"[^A-Za-z0-9._ -]", "_", filename) or "download"
    return {
        "Content-Disposition": f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(filename)}"
    }


def _pdf_bytes(session: dict) -> bytes:
    df = active_df(session)
    return generate_report(
        session["filename"],
        get_basic_info(df, session["filename"]),
        get_missing_info(df),
        session["trained_models"],
        session["cleaned_df"] is not None,
    )


def _dataset_bytes(session: dict, fmt: str) -> bytes:
    df = active_df(session)
    if fmt == "xlsx":
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        return buffer.getvalue()
    return df.to_csv(index=False).encode("utf-8")


def _write_models(archive: zipfile.ZipFile, session_id: str, trained: dict, prefix: str = "") -> list:
    session_dir = get_session_dir(session_id)
    manifest = []
    for model_key, info in trained.items():
        pkl_path = os.path.join(session_dir, f"{model_key}.pkl")
        if not os.path.exists(pkl_path):
            continue
        archive_name = f"{re.sub(r'[^A-Za-z0-9._-]+', '_', info.get('name', model_key))}.pkl"
        archive.write(pkl_path, prefix + archive_name)
        manifest.append(
            {
                "file": archive_name,
                "model_key": model_key,
                "model_name": info.get("name"),
                "task": info.get("task"),
                "target_column": info.get("target_col"),
                "feature_columns": info.get("feature_cols"),
                "class_labels": (info.get("metrics") or {}).get("class_labels"),
                "scaler": info.get("scaler_type"),
                "trained_at": info.get("trained_at"),
            }
        )
    if manifest:
        archive.writestr(prefix + "manifest.json", json.dumps(manifest, indent=2))
    return manifest


@router.get("/{session_id}/pdf")
def download_pdf(session_id: str):
    session = require_session(session_id)
    return Response(
        content=_pdf_bytes(session),
        media_type="application/pdf",
        headers=_attachment(f"{_base_name(session['filename'])}_report.pdf"),
    )


@router.get("/{session_id}/dataset")
def download_dataset(session_id: str, fmt: Literal["csv", "xlsx"] = "csv"):
    session = require_session(session_id)
    base = _base_name(session["filename"])
    content = _dataset_bytes(session, fmt)
    if fmt == "xlsx":
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=_attachment(f"{base}_cleaned.xlsx"),
        )
    return Response(
        content=content,
        media_type="text/csv",
        headers=_attachment(f"{base}_cleaned.csv"),
    )


@router.get("/{session_id}/meta")
def download_meta(session_id: str):
    session = require_session(session_id)
    meta_path = get_meta_path(session_id)
    if not os.path.exists(meta_path):
        raise HTTPException(404, "Session details weren't found. Upload your dataset again.")
    with open(meta_path, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(
        content=content.encode("utf-8"),
        media_type="application/json",
        headers=_attachment(f"{_base_name(session['filename'])}_meta.json"),
    )


@router.get("/{session_id}/models_zip")
def download_models_zip(session_id: str):
    session = require_session(session_id)
    trained = session["trained_models"]
    if not trained:
        raise HTTPException(400, "Train at least one model before downloading model files.")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        manifest = _write_models(archive, session_id, trained)

    if not manifest:
        raise HTTPException(404, "No model files were found. Train your models again to create them.")

    return Response(
        content=buffer.getvalue(),
        media_type="application/zip",
        headers=_attachment(f"{_base_name(session['filename'])}_models.zip"),
    )


@router.get("/{session_id}/bundle")
def download_bundle(session_id: str, fmt: Literal["csv", "xlsx"] = "csv"):
    session = require_session(session_id)
    base = _base_name(session["filename"])
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(f"{base}_report.pdf", _pdf_bytes(session))
        archive.writestr(f"{base}_cleaned.{fmt}", _dataset_bytes(session, fmt))
        meta_path = get_meta_path(session_id)
        if os.path.exists(meta_path):
            archive.write(meta_path, f"{base}_meta.json")
        if session["trained_models"]:
            _write_models(archive, session_id, session["trained_models"], "models/")
    return Response(
        content=buffer.getvalue(),
        media_type="application/zip",
        headers=_attachment(f"{base}_mlinsights.zip"),
    )
