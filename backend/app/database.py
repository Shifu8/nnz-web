"""
Configuración de la base de datos MySQL y motor SQLModel/SQLAlchemy.
"""
import os
from sqlmodel import SQLModel, Session, create_engine

def get_database_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://dawgs_user:dawgs_password@127.0.0.1:3306/dawgs_db"
    )

engine = create_engine(
    get_database_url(),
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
    pool_recycle=3600,
)


def init_db() -> None:
    """Crear tablas si no existen (solo para desarrollo). En producción usar Alembic."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency para inyectar sesiones de base de datos en cada request."""
    with Session(engine) as session:
        yield session
