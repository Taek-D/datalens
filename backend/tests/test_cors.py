import pytest


@pytest.mark.asyncio
async def test_cors_allowed_origin(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


@pytest.mark.asyncio
async def test_cors_disallowed_origin(client):
    response = await client.options(
        "/health",
        headers={
            "Origin": "http://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    # Disallowed origin must NOT appear in ACAO header
    acao = response.headers.get("access-control-allow-origin", "")
    assert "evil.example.com" not in acao
