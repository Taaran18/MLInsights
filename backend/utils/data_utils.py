import pandas as pd
import numpy as np
from typing import Any


def get_basic_info(df: pd.DataFrame, filename: str) -> dict:
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    datetime_cols = df.select_dtypes(include=["datetime"]).columns.tolist()

    return {
        "filename": filename,
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_names": df.columns.tolist(),
        "numeric_columns": numeric_cols,
        "categorical_columns": cat_cols,
        "datetime_columns": datetime_cols,
        "memory_usage_kb": round(df.memory_usage(deep=True).sum() / 1024, 2),
        "duplicate_rows": int(df.duplicated().sum()),
    }


def get_head(df: pd.DataFrame, n: int = 5) -> list:
    return df.head(n).replace({np.nan: None}).to_dict(orient="records")


def get_tail(df: pd.DataFrame, n: int = 5) -> list:
    return df.tail(n).replace({np.nan: None}).to_dict(orient="records")


def get_dtypes(df: pd.DataFrame) -> dict:
    return {col: str(dtype) for col, dtype in df.dtypes.items()}


def get_describe(df: pd.DataFrame) -> dict:
    desc = df.describe(include="all")
    result = {}
    for col in desc.columns:
        result[col] = {k: (None if pd.isna(v) else (float(v) if isinstance(v, (np.floating, float)) else v))
                       for k, v in desc[col].items()}
    return result


def get_missing_info(df: pd.DataFrame) -> dict:
    total = len(df)
    missing_per_col = {}
    for col in df.columns:
        null_mask = df[col].isna()
        if df[col].dtype == object:
            empty_mask = df[col].astype(str).str.strip().eq("") | df[col].astype(str).str.lower().isin(
                ["nan", "none", "null", "na", "n/a", "#n/a", "missing", "undefined", ""]
            )
            combined = null_mask | empty_mask
        else:
            combined = null_mask
        count = int(combined.sum())
        missing_per_col[col] = {
            "count": count,
            "percentage": round(count / total * 100, 2) if total > 0 else 0,
            "dtype": str(df[col].dtype),
        }

    total_missing = sum(v["count"] for v in missing_per_col.values())
    return {
        "total_cells": int(total * len(df.columns)),
        "total_missing": total_missing,
        "total_missing_percentage": round(total_missing / (total * len(df.columns)) * 100, 2) if total > 0 else 0,
        "per_column": missing_per_col,
    }


def get_value_counts(df: pd.DataFrame, col: str, top_n: int = 20) -> list:
    vc = df[col].value_counts(dropna=False).head(top_n)
    return [{"value": None if pd.isna(k) else k, "count": int(v)} for k, v in vc.items()]


def get_correlation(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty or numeric_df.shape[1] < 2:
        return {}
    corr = numeric_df.corr().round(4)
    return corr.replace({np.nan: None}).to_dict()


def clean_dataset(df: pd.DataFrame, options: dict) -> pd.DataFrame:
    result = df.copy()

    if options.get("normalize_empty_strings", True):
        for col in result.select_dtypes(include="object").columns:
            result[col] = result[col].astype(str).str.strip()
            result[col] = result[col].replace(
                ["nan", "none", "null", "na", "n/a", "#n/a", "missing", "undefined", ""], np.nan
            )

    threshold_col = options.get("drop_high_missing_cols")
    if threshold_col is not None:
        missing_pct = result.isna().mean() * 100
        cols_to_drop = missing_pct[missing_pct > threshold_col].index.tolist()
        result = result.drop(columns=cols_to_drop)

    threshold_row = options.get("drop_high_missing_rows")
    if threshold_row is not None:
        row_missing_pct = result.isna().mean(axis=1) * 100
        result = result[row_missing_pct <= threshold_row]

    fill_num = options.get("fill_numeric")
    if fill_num:
        for col in result.select_dtypes(include=[np.number]).columns:
            if fill_num == "mean":
                result[col] = result[col].fillna(result[col].mean())
            elif fill_num == "median":
                result[col] = result[col].fillna(result[col].median())
            elif fill_num == "zero":
                result[col] = result[col].fillna(0)

    fill_cat = options.get("fill_categorical")
    if fill_cat:
        for col in result.select_dtypes(include=["object", "category"]).columns:
            if fill_cat == "mode":
                mode_val = result[col].mode()
                if not mode_val.empty:
                    result[col] = result[col].fillna(mode_val[0])
            elif fill_cat == "unknown":
                result[col] = result[col].fillna("Unknown")

    if options.get("drop_duplicates", False):
        result = result.drop_duplicates()

    result = result.reset_index(drop=True)
    return result


def infer_task_type(df: pd.DataFrame, target_col: str) -> str:
    if target_col not in df.columns:
        return "clustering"
    series = df[target_col].dropna()
    n_unique = series.nunique()
    if pd.api.types.is_numeric_dtype(series):
        if n_unique <= 20 or (n_unique / len(series) < 0.05):
            return "classification"
        return "regression"
    return "classification"


PROFILE_MAX_COLUMNS = 60
PROFILE_BINS = 12


def _column_kind(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_numeric_dtype(series):
        return "number"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    return "text"


def get_column_profiles(df: pd.DataFrame) -> dict:
    rows = int(len(df))
    profiles = []
    for col in df.columns[:PROFILE_MAX_COLUMNS]:
        series = df[col]
        kind = _column_kind(series)
        missing = int(series.isna().sum())
        present = series.dropna()
        profile = {
            "name": str(col),
            "kind": kind,
            "dtype": str(series.dtype),
            "missing": missing,
            "missing_percentage": round(missing / rows * 100, 2) if rows else 0.0,
            "unique": int(present.nunique()),
        }
        if kind == "number" and len(present):
            values = pd.to_numeric(present, errors="coerce").replace([np.inf, -np.inf], np.nan).dropna()
            if len(values):
                counts, edges = np.histogram(values.to_numpy(dtype=float), bins=PROFILE_BINS)
                profile.update(
                    {
                        "min": float(values.min()),
                        "max": float(values.max()),
                        "mean": float(values.mean()),
                        "median": float(values.median()),
                        "histogram": counts.astype(int).tolist(),
                        "bin_edges": [float(edge) for edge in edges],
                    }
                )
        elif len(present):
            top = present.astype(str).value_counts().head(4)
            profile["top_values"] = [{"value": str(value), "count": int(count)} for value, count in top.items()]
        profiles.append(profile)
    total_cells = rows * df.shape[1]
    missing_cells = int(df.isna().sum().sum())
    duplicates = int(df.duplicated().sum())
    completeness = 100.0 if not total_cells else round((1 - missing_cells / total_cells) * 100, 2)
    uniqueness = 100.0 if not rows else round((1 - duplicates / rows) * 100, 2)
    constant = sum(1 for p in profiles if p["unique"] <= 1)
    consistency = 100.0 if not profiles else round((1 - constant / len(profiles)) * 100, 2)
    return {
        "rows": rows,
        "columns": int(df.shape[1]),
        "truncated": bool(df.shape[1] > PROFILE_MAX_COLUMNS),
        "quality": {
            "score": round(completeness * 0.5 + uniqueness * 0.3 + consistency * 0.2, 1),
            "completeness": completeness,
            "uniqueness": uniqueness,
            "consistency": consistency,
            "constant_columns": constant,
        },
        "profiles": profiles,
    }


def safe_json(obj: Any) -> Any:
    if obj is pd.NA or obj is pd.NaT:
        return None
    if isinstance(obj, dict):
        return {k: safe_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [safe_json(i) for i in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj
