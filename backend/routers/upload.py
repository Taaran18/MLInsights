import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.session_store import create_session
from utils.data_utils import get_basic_info, get_missing_info

router = APIRouter()

ALLOWED_TYPES = {
    "text/csv", "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
ALLOWED_EXTS = {".csv", ".xlsx", ".xls"}


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, f"Unsupported file type: {ext}. Use .csv or .xlsx")

    contents = await file.read()
    try:
        if ext == ".csv":
            # Try common encodings
            for enc in ("utf-8", "latin-1", "cp1252"):
                try:
                    import io
                    df = pd.read_csv(io.BytesIO(contents), encoding=enc)
                    break
                except UnicodeDecodeError:
                    continue
        else:
            import io
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {str(e)}")

    if df.empty:
        raise HTTPException(400, "The uploaded file is empty.")

    session_id = str(uuid.uuid4())
    create_session(session_id, df, file.filename)

    basic = get_basic_info(df, file.filename)
    missing = get_missing_info(df)

    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": basic["rows"],
        "columns": basic["columns"],
        "has_missing": missing["total_missing"] > 0,
        "total_missing": missing["total_missing"],
    }
