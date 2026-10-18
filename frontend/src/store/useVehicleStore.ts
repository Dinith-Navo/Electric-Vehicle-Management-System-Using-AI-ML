import { create } from './createStore';

interface VehicleState {
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
}

export const useVehicleStore = create<VehicleState>((set: any) => ({
  selectedVehicleId: 'EV-001',
  setSelectedVehicleId: (id: string) => set({ selectedVehicleId: id })
}));
