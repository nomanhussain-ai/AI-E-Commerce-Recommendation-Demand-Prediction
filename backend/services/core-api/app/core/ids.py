from ulid import ULID


def new_id(prefix: str = "") -> str:
    """Sortable, URL-safe ULID string primary key, optionally prefixed (e.g. ``usr_``)."""
    value = str(ULID())
    return f"{prefix}{value}" if prefix else value
