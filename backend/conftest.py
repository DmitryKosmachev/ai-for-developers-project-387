"""Общие фикстуры pytest. Импорты ленивые — чтобы юнит-тесты ядра логики
не зависели от готовности HTTP-слоя."""

import pytest


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.main import app
    from app.store import store

    store.reset()
    return TestClient(app)
