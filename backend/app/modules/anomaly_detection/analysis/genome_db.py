"""
Anomaly Genome Database — Neural Forensics Knowledge Base

Stores, catalogs, and searches Anomaly DNA fingerprints.
Maintains known strain archetypes, root causes, mitigation playbooks,
and matches incoming anomaly embeddings against historical signatures
using high-dimensional cosine similarity.
"""
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass, asdict


@dataclass
class GenomeRecord:
    genomeId: str
    strainName: str
    fingerprintHash: str
    barcode: List[float]
    embeddingVector: List[float]
    rootCause: str
    recommendedPlaybook: str
    severity: str
    firstDiscovered: str
    occurrenceCount: int
    matchedVehicles: List[str]
    dominantGenes: List[str]


class AnomalyGenomeDB:
    """
    In-memory vector database for Anomaly Genomes.
    In production this could back onto ChromaDB/FAISS/Milvus,
    here using vector-accelerated NumPy cosine distance.
    """
    _instance: Optional["AnomalyGenomeDB"] = None

    def __init__(self):
        self._records: Dict[str, GenomeRecord] = {}
        self._seed_known_genomes()

    @classmethod
    def get_instance(cls) -> "AnomalyGenomeDB":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _seed_known_genomes(self):
        """Seed known historical anomaly strains observed in EV fleets."""
        now = datetime.now(timezone.utc).isoformat()
        
        # Archetype 1: Thermal Cascade
        v1 = np.zeros(128)
        v1[0:8] = [0.1, 0.4, 0.95, 0.85, 0.2, 0.3, 0.6, 0.1]
        v1 = v1 / (np.linalg.norm(v1) + 1e-8)
        self.register_genome(
            genome_id="GENOME_THM_01",
            strain_name="THERMAL_CASCADE",
            hash_str="a8b79f2e3c1d4a5b6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90123",
            barcode=[0.9, 0.85, 0.7, 0.6, 0.95, 0.8, 0.4, 0.2] * 4,
            embedding=v1.tolist(),
            root_cause="Coolant circulation valve failure causing runaway cell temperatures.",
            playbook="Activate auxiliary chiller, derate motor torque by 60%, pull vehicle over if temp > 65°C.",
            severity="CRITICAL",
            dominant_genes=["batteryTemperature", "motorTemperature", "batteryCurrent"]
        )

        # Archetype 2: Electrical Storm
        v2 = np.zeros(128)
        v2[0:8] = [0.9, 0.85, 0.2, 0.1, 0.4, 0.3, 0.9, 0.5]
        v2 = v2 / (np.linalg.norm(v2) + 1e-8)
        self.register_genome(
            genome_id="GENOME_ELE_01",
            strain_name="ELECTRICAL_STORM",
            hash_str="f1e2d3c4b5a697887766554433221100ffeeddccbbaa99887766554433221100",
            barcode=[0.3, 0.95, 0.88, 0.2, 0.4, 0.75, 0.9, 0.6] * 4,
            embedding=v2.tolist(),
            root_cause="Contactor resistance spike and inverter switching transients.",
            playbook="Isolate HV bus contactor 2, engage regenerative braking lock, switch to limp-home mode.",
            severity="HIGH",
            dominant_genes=["batteryVoltage", "batteryCurrent", "powerConsumption"]
        )

        # Archetype 3: Motor Meltdown
        v3 = np.zeros(128)
        v3[0:8] = [0.2, 0.7, 0.3, 0.98, 0.7, 0.8, 0.85, 0.3]
        v3 = v3 / (np.linalg.norm(v3) + 1e-8)
        self.register_genome(
            genome_id="GENOME_MTR_01",
            strain_name="MOTOR_MELTDOWN",
            hash_str="1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            barcode=[0.2, 0.5, 0.98, 0.92, 0.3, 0.8, 0.7, 0.4] * 4,
            embedding=v3.tolist(),
            root_cause="Stator winding insulation breakdown under high acceleration load.",
            playbook="Cap inverter output frequency, limit speed to 45 km/h, check resolver synchronization.",
            severity="HIGH",
            dominant_genes=["motorTemperature", "batteryCurrent", "acceleration"]
        )

        # Archetype 4: Charge Corruption
        v4 = np.zeros(128)
        v4[0:8] = [0.85, 0.9, 0.6, 0.2, 0.0, 0.0, 0.5, 0.9]
        v4 = v4 / (np.linalg.norm(v4) + 1e-8)
        self.register_genome(
            genome_id="GENOME_CHG_01",
            strain_name="CHARGE_CORRUPTION",
            hash_str="abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            barcode=[0.8, 0.9, 0.4, 0.1, 0.7, 0.85, 0.3, 0.9] * 4,
            embedding=v4.tolist(),
            root_cause="DC fast charging communication desync or BMS cell voltage skew.",
            playbook="Abort active charging session, open DC charge port contactors, request slow balancing cycle.",
            severity="MEDIUM",
            dominant_genes=["batteryVoltage", "batteryCurrent", "soc"]
        )

        # 🇱🇰 Sri Lankan Archetype 1: Kadugannawa Incline Thermal Surge (A1 Colombo-Kandy)
        v_sl1 = np.zeros(128)
        v_sl1[0:8] = [0.3, 0.75, 0.92, 0.96, 0.35, 0.6, 0.88, 0.4]
        v_sl1 = v_sl1 / (np.linalg.norm(v_sl1) + 1e-8)
        self.register_genome(
            genome_id="GENOME_SL_KANDY_01",
            strain_name="KANDY_INCLINE_THERMAL_SURGE",
            hash_str="sl8877665544332211aabbccddeeff00112233445566778899aabbccddeeff00",
            barcode=[0.35, 0.8, 0.95, 0.98, 0.4, 0.65, 0.9, 0.5] * 4,
            embedding=v_sl1.tolist(),
            root_cause="Sustained 9.2% mountain grade climb on Kadugannawa Pass combined with 34°C tropical heat causing air-cooled stator and battery pack saturation.",
            playbook="Derate inverter torque by 40%, engage auxiliary cabin ventilation bypass, advise 10-min rest at Kadugannawa rest stop.",
            severity="HIGH",
            dominant_genes=["motorTemperature", "batteryTemperature", "powerConsumption"]
        )

        # 🇱🇰 Sri Lankan Archetype 2: Colombo Monsoon Submersion & Moisture Leakage
        v_sl2 = np.zeros(128)
        v_sl2[0:8] = [0.94, 0.88, 0.25, 0.2, 0.2, 0.15, 0.85, 0.7]
        v_sl2 = v_sl2 / (np.linalg.norm(v_sl2) + 1e-8)
        self.register_genome(
            genome_id="GENOME_SL_MONSOON_01",
            strain_name="COLOMBO_MONSOON_INGRESS_LEAKAGE",
            hash_str="sl112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
            barcode=[0.95, 0.9, 0.3, 0.2, 0.2, 0.1, 0.85, 0.8] * 4,
            embedding=v_sl2.tolist(),
            root_cause="Southwest monsoon street water splash on Kelani river basin causing chassis insulation resistance drop below 200 kOhm and ground leakage.",
            playbook="Isolate high-voltage pyrofuse, check battery tray drain ports, do not connect to AC charging until insulation resistance > 100 MOhm.",
            severity="CRITICAL",
            dominant_genes=["batteryVoltage", "batteryCurrent", "powerConsumption"]
        )

        # 🇱🇰 Sri Lankan Archetype 3: CEB Grid Brownout & Harmonic Distortion (185V Sag)
        v_sl3 = np.zeros(128)
        v_sl3[0:8] = [0.98, 0.7, 0.4, 0.1, 0.0, 0.0, 0.6, 0.95]
        v_sl3 = v_sl3 / (np.linalg.norm(v_sl3) + 1e-8)
        self.register_genome(
            genome_id="GENOME_SL_CEB_01",
            strain_name="CEB_GRID_BROWNOUT_CORRUPTION",
            hash_str="slceb0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            barcode=[0.98, 0.75, 0.45, 0.1, 0.0, 0.0, 0.65, 0.98] * 4,
            embedding=v_sl3.tolist(),
            root_cause="Ceylon Electricity Board distribution transformer sag to 182V with 49.1Hz frequency fluctuation during evening peak hour charging (18:30-22:30).",
            playbook="Disconnect onboard AC charger, switch to CEB Off-Peak charging timer (22:35 PM window), inspect AC inlet surge protection varistor.",
            severity="MEDIUM",
            dominant_genes=["batteryVoltage", "batteryCurrent", "soc"]
        )

        # 🇱🇰 Sri Lankan Archetype 4: Reconditioned / Repacked Module Cell Imbalance
        v_sl4 = np.zeros(128)
        v_sl4[0:8] = [0.85, 0.6, 0.7, 0.3, 0.4, 0.4, 0.75, 0.6]
        v_sl4 = v_sl4 / (np.linalg.norm(v_sl4) + 1e-8)
        self.register_genome(
            genome_id="GENOME_SL_REPACK_01",
            strain_name="REPACKED_LFP_CELL_IMBALANCE",
            hash_str="slrep99887766554433221100ffeeddccbbaa99887766554433221100ffeedd",
            barcode=[0.88, 0.65, 0.72, 0.35, 0.45, 0.45, 0.8, 0.65] * 4,
            embedding=v_sl4.tolist(),
            root_cause="Local Sri Lankan battery module conversion impedance mismatch (CATL cells swapped into Nissan Leaf pack), causing delta-V skew > 120mV under acceleration.",
            playbook="Perform active top-balancing BMS cycle, limit peak discharge current to 120A, schedule pack resistance testing at local EV workshop.",
            severity="HIGH",
            dominant_genes=["batteryVoltage", "batteryCurrent", "batteryTemperature"]
        )

    def register_genome(
        self,
        genome_id: str,
        strain_name: str,
        hash_str: str,
        barcode: List[float],
        embedding: List[float],
        root_cause: str,
        playbook: str,
        severity: str,
        dominant_genes: List[str],
        vehicle_id: str = "SYSTEM_BASELINE"
    ) -> GenomeRecord:
        record = GenomeRecord(
            genomeId=genome_id,
            strainName=strain_name,
            fingerprintHash=hash_str,
            barcode=barcode[:32],
            embeddingVector=embedding[:128],
            rootCause=root_cause,
            recommendedPlaybook=playbook,
            severity=severity,
            firstDiscovered=datetime.now(timezone.utc).isoformat(),
            occurrenceCount=1,
            matchedVehicles=[vehicle_id],
            dominantGenes=dominant_genes
        )
        self._records[genome_id] = record
        return record

    def find_nearest_matches(
        self,
        query_embedding: List[float],
        top_k: int = 3,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Calculates cosine similarity between query anomaly embedding
        and all cataloged strains in the Genome Database.
        """
        if not self._records or not query_embedding:
            return []

        q = np.array(query_embedding, dtype=np.float64)
        q_norm = np.linalg.norm(q)
        if q_norm < 1e-8:
            return []
        q = q / q_norm

        matches = []
        for gid, record in self._records.items():
            r = np.array(record.embeddingVector, dtype=np.float64)
            r_norm = np.linalg.norm(r)
            if r_norm < 1e-8:
                continue
            r = r / r_norm

            sim = float(np.dot(q, r))
            matches.append({
                "similarity": round(max(0.0, min(1.0, sim)), 4),
                "record": asdict(record)
            })

        matches.sort(key=lambda m: m["similarity"], reverse=True)
        return [m for m in matches[:top_k] if m["similarity"] >= threshold]

    def record_occurrence(self, strain_name: str, vehicle_id: str, embedding: List[float]):
        """Increment count or learn new variation."""
        for rec in self._records.values():
            if rec.strainName == strain_name:
                rec.occurrenceCount += 1
                if vehicle_id not in rec.matchedVehicles:
                    rec.matchedVehicles.append(vehicle_id)
                return

    def get_all_strains(self) -> List[Dict[str, Any]]:
        return [asdict(r) for r in self._records.values()]
