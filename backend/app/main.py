from typing import Annotated, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.airspace.simulation import Simulation
from app.laboratory import run_laboratory

app = FastAPI(
    title="AERIS Airspace Simulation",
    description="Simulador acadêmico de tráfego aéreo sintético. Não é um sistema de segurança aeronáutica.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
simulation = Simulation()


class AdvanceRequest(BaseModel):
    seconds: float = Field(default=1, gt=0, le=10)


class SpeedRequest(BaseModel):
    value: int = Field(ge=1, le=100)


class LaboratoryRequest(BaseModel):
    sizes: list[Annotated[int, Field(ge=10, le=2000)]] = Field(
        default_factory=lambda: [200, 400, 800, 1600], min_length=1, max_length=6
    )
    pattern: Literal["random", "sorted"] = "random"


@app.get("/api/health")
def health():
    return {"status": "ok", "simulated": True}


@app.get("/api/snapshot")
def snapshot():
    return simulation.snapshot()


@app.post("/api/advance")
def advance(request: AdvanceRequest):
    return simulation.advance(request.seconds)


@app.post("/api/reset")
def reset():
    return simulation.reset()


@app.post("/api/speed")
def speed(request: SpeedRequest):
    simulation.speed = request.value
    return simulation.snapshot()


@app.get("/api/analysis")
def analysis():
    return simulation.analysis()


@app.post("/api/laboratory")
def laboratory(request: LaboratoryRequest):
    return run_laboratory(sorted(set(request.sizes)), request.pattern)
