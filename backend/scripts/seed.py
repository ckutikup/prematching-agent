"""Upload the program catalog into Supabase and compute/store embeddings.

Run: `python -m scripts.seed` from the backend/ directory."""

import json
from pathlib import Path

from app.db import get_supabase
from app.embeddings import embed_documents, program_text


def main() -> None:
    data_path = Path(__file__).resolve().parents[1] / "data" / "programs.json"
    programs = json.loads(data_path.read_text())

    sb = get_supabase()
    sb.table("programs").upsert(programs, on_conflict="slug").execute()
    print(f"Upserted {len(programs)} programs.")

    texts = [program_text(p) for p in programs]
    vectors = embed_documents(texts)

    # Update each row's embedding individually. The catalog is small (20
    # programs) so one round-trip per row is fine; a bulk UPDATE would
    # require a stored proc or raw SQL.
    for program, vec in zip(programs, vectors):
        sb.table("programs").update({"embedding": vec}).eq("slug", program["slug"]).execute()
    print(f"Embedded {len(vectors)} programs with {len(vectors[0])}-dim vectors.")


if __name__ == "__main__":
    main()
