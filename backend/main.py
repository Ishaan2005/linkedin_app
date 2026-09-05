import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
from models import Base, Company
from routers import leads, companies, jobs, outreach, settings, dev, discovery, ingestion
from routers.dev import seed_defaults

Base.metadata.create_all(bind=engine)

# Auto-seed defaults if database tables are brand new / empty
def _auto_seed_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Company).count()
        if count == 0:
            seed_defaults(db)
    finally:
        db.close()

_auto_seed_if_empty()

app = FastAPI(title="LinkedIn Job Hunting Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(discovery.router)
app.include_router(ingestion.router)
app.include_router(companies.router)
app.include_router(jobs.router)
app.include_router(outreach.router)
app.include_router(settings.router)
app.include_router(dev.router)


@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
