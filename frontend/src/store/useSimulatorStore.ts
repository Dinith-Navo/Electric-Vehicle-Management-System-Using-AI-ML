import { create } from 'zustand';
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

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  scenario: 'NORMAL_DRIVING',
  severityFactor: 0.5,
  noiseFactor: 0.1,
  isStreaming: true,
  currentTelemetry: generateSimulatedTelemetry('EV-001', 'NORMAL_DRIVING'),

  setScenario: (scenario) => set({ scenario }),
  setSeverityFactor: (severityFactor) => set({ severityFactor }),
  setNoiseFactor: (noiseFactor) => set({ noiseFactor }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),

  tickTelemetry: (vehicleId: string) => {
    const { scenario, severityFactor, noiseFactor } = get();
    const updated = generateSimulatedTelemetry(vehicleId, scenario, severityFactor, noiseFactor);
    set({ currentTelemetry: updated });
    return updated;
  }
}));
