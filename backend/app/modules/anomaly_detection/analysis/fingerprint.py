"""
Anomaly DNA Fingerprinting Engine — Neural Forensics Module

Generates a unique 128-dimensional anomaly embedding vector, hashes it into a 
visual "DNA barcode" fingerprint. Each anomaly gets a unique genetic signature
that can be matched against historically seen patterns.
"""
import hashlib
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass


@dataclass
class AnomalyDNA:
    """Represents an Anomaly's unique genetic fingerprint."""
    fingerprint_hash: str        # 64-char hex hash
    dna_barcode: List[float]     # 32-element barcode for visualization (0.0 - 1.0)
    embedding_vector: List[float]  # 128-dim embedding
    dominant_genes: List[Dict[str, Any]]  # Top contributing "genes" (features)
    strain_type: str             # Classification of anomaly strain
    mutation_score: float        # How "novel" this anomaly is (0 = seen before, 1 = totally new)


class AnomalyFingerprintEngine:
    """
    Creates unique DNA fingerprints for anomaly patterns using
    feature-space embedding and locality-sensitive hashing.
    """

    # Feature importance weights for DNA encoding
    GENE_WEIGHTS = {
        "batteryVoltage": 1.2,
        "batteryCurrent": 1.3,
        "batteryTemperature": 1.5,
        "motorTemperature": 1.5,
        "vehicleSpeed": 0.8,
        "acceleration": 0.9,
        "powerConsumption": 1.1,
        "soc": 0.7,
    }

    # Known anomaly strain signatures (pattern archetypes)
    STRAIN_ARCHETYPES = {
        "THERMAL_CASCADE": {"batteryTemperature": 1.0, "motorTemperature": 1.0, "batteryCurrent": 0.6},
        "ELECTRICAL_STORM": {"batteryVoltage": 1.0, "batteryCurrent": 1.0, "powerConsumption": 0.5},
        "MOTOR_MELTDOWN": {"motorTemperature": 1.0, "batteryCurrent": 0.8, "powerConsumption": 0.7},
        "CHARGE_CORRUPTION": {"batteryVoltage": 0.9, "batteryCurrent": 1.0, "batteryTemperature": 0.6},
        "POWER_HEMORRHAGE": {"powerConsumption": 1.0, "batteryCurrent": 0.7, "vehicleSpeed": 0.5},
        "MULTI_ORGAN_FAILURE": {"batteryVoltage": 0.8, "motorTemperature": 0.8, "batteryTemperature": 0.8, "powerConsumption": 0.8},
        "PHANTOM_ANOMALY": {},  # Unknown/novel strain
    }

    @staticmethod
    def _compute_deviation_vector(
        telemetry_values: Dict[str, float],
        reference_values: Dict[str, float]
    ) -> np.ndarray:
        """Compute normalized deviation vector from reference baselines."""
        features = list(AnomalyFingerprintEngine.GENE_WEIGHTS.keys())
        deviations = []
        for feat in features:
            current = telemetry_values.get(feat, 0.0)
            ref = reference_values.get(feat, 1.0)
            weight = AnomalyFingerprintEngine.GENE_WEIGHTS.get(feat, 1.0)
            dev = ((current - ref) / (abs(ref) + 1e-6)) * weight
            deviations.append(dev)
        return np.array(deviations, dtype=np.float64)

    @staticmethod
    def _generate_embedding(
        deviation_vector: np.ndarray,
        model_evidences: Dict[str, float],
        ensemble_score: float,
        feature_errors: Dict[str, float]
    ) -> np.ndarray:
        """
        Generate a 128-dimensional anomaly embedding vector using
        feature deviation cross-products and model evidence interleaving.
        """
        # Base: 8 deviation values
        base = deviation_vector.copy()

        # Cross-products: 8 * 8 = 64 dimensions (upper triangle = 28 + diagonal = 8 = 36)
        n = len(base)
        cross = []
        for i in range(n):
            for j in range(i, n):
                cross.append(base[i] * base[j])

        # Model evidence encoding (3 models * 4 features each = 12)
        if_ev = model_evidences.get("isolationForest", 0.0)
        svm_ev = model_evidences.get("oneClassSVM", 0.0)
        ae_ev = model_evidences.get("autoencoder", 0.0)

        model_encoding = [
            if_ev, svm_ev, ae_ev,
            if_ev * svm_ev, if_ev * ae_ev, svm_ev * ae_ev,
            if_ev * svm_ev * ae_ev,
            abs(if_ev - svm_ev), abs(if_ev - ae_ev), abs(svm_ev - ae_ev),
            ensemble_score,
            max(if_ev, svm_ev, ae_ev) - min(if_ev, svm_ev, ae_ev)
        ]

        # Feature reconstruction errors (up to 8)
        feat_err_vals = []
        for key in AnomalyFingerprintEngine.GENE_WEIGHTS.keys():
            feat_err_vals.append(feature_errors.get(key, 0.0))

        # Temporal signature: sinusoidal encoding of deviation magnitudes
        temporal_sig = []
        for i, d in enumerate(base):
            temporal_sig.append(np.sin(d * (i + 1) * np.pi))
            temporal_sig.append(np.cos(d * (i + 1) * np.pi))

        # Concatenate all
        raw_embedding = np.concatenate([
            base,           # 8
            cross,          # 36
            model_encoding, # 12
            feat_err_vals,  # 8
            temporal_sig,   # 16
        ])

        # Pad or truncate to exactly 128 dimensions
        if len(raw_embedding) < 128:
            raw_embedding = np.pad(raw_embedding, (0, 128 - len(raw_embedding)), mode='constant')
        else:
            raw_embedding = raw_embedding[:128]

        # L2 normalize
        norm = np.linalg.norm(raw_embedding)
        if norm > 1e-8:
            raw_embedding = raw_embedding / norm

        return raw_embedding

    @staticmethod
    def _embedding_to_barcode(embedding: np.ndarray) -> List[float]:
        """Convert 128-dim embedding into a 32-element visual barcode."""
        barcode = []
        chunk_size = len(embedding) // 32
        for i in range(32):
            chunk = embedding[i * chunk_size: (i + 1) * chunk_size]
            # Map to [0, 1] range using sigmoid-like transformation
            val = float(np.mean(np.abs(chunk)))
            barcode.append(round(min(1.0, val * 3.0), 4))
        return barcode

    @staticmethod
    def _compute_hash(embedding: np.ndarray) -> str:
        """Create a deterministic 64-char hex hash from the embedding."""
        # Quantize to reduce noise sensitivity
        quantized = np.round(embedding * 1000).astype(np.int32)
        raw_bytes = quantized.tobytes()
        return hashlib.sha256(raw_bytes).hexdigest()

    @staticmethod
    def _classify_strain(
        deviation_vector: np.ndarray,
        telemetry_values: Dict[str, float],
        reference_values: Dict[str, float]
    ) -> Tuple[str, float]:
        """
        Classify the anomaly into a known strain archetype using
        cosine similarity against known patterns.
        """
        features = list(AnomalyFingerprintEngine.GENE_WEIGHTS.keys())

        # Compute deviation percentages per feature
        dev_pct = {}
        for i, feat in enumerate(features):
            current = telemetry_values.get(feat, 0.0)
            ref = reference_values.get(feat, 1.0)
            dev_pct[feat] = abs(current - ref) / (abs(ref) + 1e-6)

        best_strain = "PHANTOM_ANOMALY"
        best_similarity = 0.0

        for strain_name, strain_pattern in AnomalyFingerprintEngine.STRAIN_ARCHETYPES.items():
            if strain_name == "PHANTOM_ANOMALY" or not strain_pattern:
                continue

            # Compute cosine similarity
            pattern_vec = np.array([strain_pattern.get(f, 0.0) for f in features])
            dev_vec = np.array([dev_pct.get(f, 0.0) for f in features])

            dot = np.dot(pattern_vec, dev_vec)
            norm_p = np.linalg.norm(pattern_vec) + 1e-8
            norm_d = np.linalg.norm(dev_vec) + 1e-8
            similarity = float(dot / (norm_p * norm_d))

            if similarity > best_similarity:
                best_similarity = similarity
                best_strain = strain_name

        # Mutation score = 1 - similarity (higher = more novel)
        mutation_score = round(max(0.0, 1.0 - best_similarity), 4)

        if best_similarity < 0.25:
            best_strain = "PHANTOM_ANOMALY"
            mutation_score = 1.0

        return best_strain, mutation_score

    @staticmethod
    def _identify_dominant_genes(
        deviation_vector: np.ndarray,
        feature_errors: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Identify the top contributing 'genes' (features) to this anomaly."""
        features = list(AnomalyFingerprintEngine.GENE_WEIGHTS.keys())
        genes = []

        for i, feat in enumerate(features):
            dev_magnitude = abs(deviation_vector[i]) if i < len(deviation_vector) else 0.0
            reconstruction_err = feature_errors.get(feat, 0.0)
            gene_strength = (dev_magnitude * 0.6) + (reconstruction_err * 0.4)

            if gene_strength > 0.05:
                genes.append({
                    "gene": feat,
                    "strength": round(float(gene_strength), 4),
                    "deviationMagnitude": round(float(dev_magnitude), 4),
                    "reconstructionError": round(float(reconstruction_err), 4),
                    "expression": "OVEREXPRESSED" if deviation_vector[i] > 0 else "UNDEREXPRESSED"
                })

        # Sort by strength descending
        genes.sort(key=lambda g: g["strength"], reverse=True)
        return genes[:6]  # Top 6 dominant genes

    @classmethod
    def generate_fingerprint(
        cls,
        telemetry_values: Dict[str, float],
        reference_values: Dict[str, float],
        model_evidences: Dict[str, float],
        ensemble_score: float,
        feature_errors: Dict[str, float]
    ) -> AnomalyDNA:
        """
        Generate a complete Anomaly DNA fingerprint from telemetry data
        and model evaluation results.
        """
        # Step 1: Compute deviation vector
        deviation_vector = cls._compute_deviation_vector(telemetry_values, reference_values)

        # Step 2: Generate 128-dim embedding
        embedding = cls._generate_embedding(
            deviation_vector, model_evidences, ensemble_score, feature_errors
        )

        # Step 3: Generate visual barcode
        barcode = cls._embedding_to_barcode(embedding)

        # Step 4: Compute hash
        fingerprint_hash = cls._compute_hash(embedding)

        # Step 5: Classify strain
        strain_type, mutation_score = cls._classify_strain(
            deviation_vector, telemetry_values, reference_values
        )

        # Step 6: Identify dominant genes
        dominant_genes = cls._identify_dominant_genes(deviation_vector, feature_errors)

        return AnomalyDNA(
            fingerprint_hash=fingerprint_hash,
            dna_barcode=barcode,
            embedding_vector=[round(float(x), 6) for x in embedding],
            dominant_genes=dominant_genes,
            strain_type=strain_type,
            mutation_score=mutation_score
        )
