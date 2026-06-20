from fastapi import APIRouter

from app.models import Owner
from app.store import store

router = APIRouter(tags=["Гость"])


@router.get("/owner", response_model=Owner)
def get_owner() -> Owner:
    return store.owner
