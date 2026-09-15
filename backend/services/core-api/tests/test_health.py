async def test_health_returns_envelope(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] in {"ok", "degraded"}
    assert "database" in body["checks"]


async def test_root_points_to_docs(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json()["service"] == "core-api"


async def test_unknown_route_uses_error_envelope(client):
    resp = await client.get("/api/v1/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["request_id"].startswith("req_")
