import unittest
from app.schemas.range_schema import RangePredictionRequest
from app.services.range_service import predict_ev_range
from app.schemas.queue_schema import QueuePredictionRequest
from app.services.queue_service import predict_station_queue

class TestMLService(unittest.TestCase):
    def test_range_prediction_fallback(self):
        req = RangePredictionRequest(
            soc=75.0,
            batteryCapacityKWh=60.0,
            speedKmH=55.0,
            temperatureC=25.0,
            energyConsumptionKWhPer100Km=15.0,
            acOn=False,
            drivingMode="Normal"
        )
        result = predict_ev_range(req)
        self.assertTrue(result.remainingRangeKm > 0)
        self.assertIn(result.source, ["mock", "trained-model"])
        self.assertGreater(result.confidenceScore, 0.5)

    def test_range_prediction_extreme_temp(self):
        # Cold weather should result in lower range
        req_cold = RangePredictionRequest(soc=80.0, batteryCapacityKWh=60.0, temperatureC=-5.0)
        req_normal = RangePredictionRequest(soc=80.0, batteryCapacityKWh=60.0, temperatureC=22.0)
        res_cold = predict_ev_range(req_cold)
        res_normal = predict_ev_range(req_normal)
        self.assertLess(res_cold.remainingRangeKm, res_normal.remainingRangeKm)

    def test_queue_prediction_fallback(self):
        req = QueuePredictionRequest(
            stationId="test_station_1",
            totalChargers=6,
            currentlyOccupied=5,
            arrivalHour=18,
            dayOfWeek=4,
            chargingSpeedKw=50.0,
            avgSessionMinutes=30.0
        )
        result = predict_station_queue(req)
        self.assertEqual(result.stationId, "test_station_1")
        self.assertEqual(result.availableChargersNow, 1)
        self.assertTrue(result.predictedQueueLength >= 0)
        self.assertTrue(result.estimatedWaitMinutes >= 0)
        self.assertIn(result.source, ["mock", "trained-model"])

if __name__ == "__main__":
    unittest.main()
