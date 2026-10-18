import uuid
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.schemas.anomaly import StandardApiResponse
from app.adversarial.evaluator import AdversarialEvaluator
from app.adversarial.generator import AdversarialGenerator
from app.core.logging import logger

router = APIRouter(prefix="/adversarial", tags=["Adversarial Red-Team Lab"])

class AttackRequest(BaseModel):
    attackType: str = "FGSM"  # "FGSM" | "PGD" | "STEALTH_DRIFT"
    epsilon: float = 0.20
    steps: int = 6

class PerturbRequest(BaseModel):
    telemetry: Dict[str, float]
    epsilon: float = 0.15
    attackType: str = "FGSM"

_latest_report: Optional[Dict[str, Any]] = None

@router.post("/test", response_model=StandardApiResponse)
async def run_adversarial_campaign(req: AttackRequest):
    global _latest_report
    request_id = f"adv_run_{uuid.uuid4().hex[:8]}"
    logger.info(f"Running adversarial campaign: type={req.attackType}, eps={req.epsilon}")
    
    result = AdversarialEvaluator.run_campaign(
        attack_type=req.attackType,
        max_epsilon=req.epsilon,
        steps=req.steps
    )
    from dataclasses import asdict
    result_dict = asdict(result)
    _latest_report = result_dict
    
    return StandardApiResponse(
        success=True,
        data=result_dict,
        meta={"requestId": request_id}
    )

@router.get("/robustness-report", response_model=StandardApiResponse)
async def get_robustness_report():
    global _latest_report
    request_id = f"adv_rep_{uuid.uuid4().hex[:8]}"
    if _latest_report is None:
        result = AdversarialEvaluator.run_campaign()
        from dataclasses import asdict
        _latest_report = asdict(result)
        
    return StandardApiResponse(
        success=True,
        data=_latest_report,
        meta={"requestId": request_id}
    )

@router.post("/perturb", response_model=StandardApiResponse)
async def generate_perturbed_sample(req: PerturbRequest):
    request_id = f"adv_pt_{uuid.uuid4().hex[:8]}"
    if req.attackType == "STEALTH_DRIFT":
        perturbed = AdversarialGenerator.generate_stealth_drift(req.telemetry, intensity=req.epsilon)
    else:
        perturbed = AdversarialGenerator.generate_fgsm_perturbation(req.telemetry, epsilon=req.epsilon)
        
    return StandardApiResponse(
        success=True,
        data={"clean": req.telemetry, "perturbed": perturbed, "epsilon": req.epsilon},
        meta={"requestId": request_id}
    )
