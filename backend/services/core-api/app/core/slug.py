import re

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    slug = _NON_ALNUM.sub("-", text.lower()).strip("-")
    return slug or "item"
