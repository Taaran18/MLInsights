import io
import os
import json
import zipfile
import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from utils.session_store import get_session, get_active_df, get_session_dir, get_meta_path
from utils.data_utils import get_basic_info, get_missing_info
from utils.report_gen import generate_report

router = APIRouter()


@router.get("/{session_id}/pdf")
def download_pdf(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    df = get_active_df(session_id)
    basic = get_basic_info(df, session["filename"])
    missing = get_missing_info(df)
    trained = session.get("trained_models", {})

    pdf_bytes = generate_report(session["filename"], basic, missing, trained)
    filename = session["filename"].rsplit(".", 1)[0] + "_report.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{session_id}/dataset")
def download_dataset(session_id: str, fmt: str = "csv"):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    df = get_active_df(session_id)
    base_name = session["filename"].rsplit(".", 1)[0]

    if fmt == "xlsx":
        buf = io.BytesIO()
        df.to_excel(buf, index=False)
        buf.seek(0)
        return Response(
            content=buf.read(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_cleaned.xlsx"'},
        )
    else:
        csv_str = df.to_csv(index=False)
        return Response(
            content=csv_str.encode("utf-8"),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{base_name}_cleaned.csv"'},
        )


@router.get("/{session_id}/meta")
def download_meta(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    meta_path = get_meta_path(session_id)
    if not os.path.exists(meta_path):
        raise HTTPException(404, "Meta file not found.")

    with open(meta_path, "r", encoding="utf-8") as f:
        meta_content = f.read()

    base_name = session["filename"].rsplit(".", 1)[0]
    return Response(
        content=meta_content.encode("utf-8"),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{base_name}_meta.json"'},
    )


@router.get("/{session_id}/models_zip")
def download_models_zip(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found.")

    trained = session.get("trained_models", {})
    if not trained:
        raise HTTPException(400, "No trained models to download.")

    session_dir = get_session_dir(session_id)
    buf = io.BytesIO()
    count = 0
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for model_key, model_info in trained.items():
            pkl_path = os.path.join(session_dir, f"{model_key}.pkl")
            if os.path.exists(pkl_path):
                friendly_name = model_info.get("name", model_key).replace(" ", "_")
                zf.write(pkl_path, f"{friendly_name}.pkl")
                count += 1

    if count == 0:
        raise HTTPException(404, "No .pkl files found. Retrain your models to generate them.")

    buf.seek(0)
    base_name = session["filename"].rsplit(".", 1)[0]
    return Response(
        content=buf.read(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{base_name}_models.zip"'},
    )
