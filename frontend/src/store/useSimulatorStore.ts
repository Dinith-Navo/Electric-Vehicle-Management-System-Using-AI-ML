import { create } from './createStore';
import { Telemetry, SimulatorScenario } from '../types/telemetry';
import { generateSimulatedTelemetry } from '../utils/simulatorEngine';

interface SimulatorState {
  scenario: SimulatorScenario;
  severityFactor: number;
  noiseFactor: number;
  isStreaming: boolean;
  currentTelemetry: Telemetry;

  setScenario: (scenario: SimulatorScenario) => void;
  setSeverityFactor: (factor: number) => void;
  setNoiseFactor: (factor: number) => void;
  setIsStreaming: (streaming: boolean) => void;
  tickTelemetry: (vehicleId: string) => Telemetry;
}

export const useSimulatorStore = create<SimulatorState>((set: any, get: any) => ({
  scenario: 'NORMAL_DRIVING',
  severityFactor: 0.5,
  noiseFactor: 0.1,
  isStreaming: false,
  currentTelemetry: generateSimulatedTelemetry('EV-001', 'NORMAL_DRIVING'),

  setScenario: (scenario: SimulatorScenario) => set({ scenario }),
  setSeverityFactor: (severityFactor: number) => set({ severityFactor }),
  setNoiseFactor: (noiseFactor: number) => set({ noiseFactor }),
  setIsStreaming: (isStreaming: boolean) => set({ isStreaming }),

  tickTelemetry: (vehicleId: string) => {
    const { scenario, severityFactor, noiseFactor } = get();
    const updated = generateSimulatedTelemetry(vehicleId, scenario, severityFactor, noiseFactor);
    set({ currentTelemetry: updated });
    return updated;
  }
}));
