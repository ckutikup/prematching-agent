import importlib

from fastapi.testclient import TestClient


def test_production_routes(tmp_path, monkeypatch):
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log('ok')")
    (tmp_path / "index.html").write_text("<html>PreMatching</html>")
    monkeypatch.setenv("FRONTEND_DIST", str(tmp_path))
    import app.main as main
    importlib.reload(main)
    client = TestClient(main.app)
    for path in ("/health", "/api/health"):
        assert client.get(path).json()["ok"] is True
    for path in ("/", "/intake", "/program/example", "/matches", "/saved"):
        assert "PreMatching" in client.get(path).text
    assert client.get("/assets/app.js").status_code == 200
    assert client.get("/missing.js").status_code == 404
    assert client.get("/api/missing").status_code == 404
