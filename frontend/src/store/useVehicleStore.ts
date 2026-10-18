import { create } from 'zustand';

export interface SriLankanVehicle {
  id: string;
  plate: string;
  name: string;
  manufacturer: string;
  model: string;
  year: number;
  type: 'CAR' | 'TUK_TUK' | 'BUS' | 'SUV';
  batteryChemistry: string;
  packCapacityKwh: number;
  sohText: string;
  repackStatus: string;
  corridor: string;
  cebTariffPlan: string;
  climateVulnerability: string;
}

export const SRI_LANKAN_FLEET: SriLankanVehicle[] = [
  {
    id: 'SL-LEAF-7429',
    plate: 'WP CBB-7429',
    name: 'Nissan Leaf AZE0 (30kWh)',
    manufacturer: 'Nissan',
    model: 'Leaf AZE0 Gen 2',
    year: 2017,
    type: 'CAR',
    batteryChemistry: 'NMC Air-Cooled Pouch',
    packCapacityKwh: 30.0,
    sohText: '10/12 Bars (81% SoH)',
    repackStatus: '2 Reconditioned CALB Modules Swapped',
    corridor: 'A1 Colombo - Gampaha Coastal Corridor',
    cebTariffPlan: 'Domestic Time-of-Use (TOU)',
    climateVulnerability: 'High Tropical Heat Degradation (Passive Air Cooling)'
  },
  {
    id: 'SL-TUK-8812',
    plate: 'WP ABG-8812',
    name: 'Vega / DIMO Electric Three-Wheeler',
    manufacturer: 'Vega Innovations / DIMO',
    model: 'E-Tuk Cargo Master Pro',
    year: 2024,
    type: 'TUK_TUK',
    batteryChemistry: 'LFP Prismatic 48V',
    packCapacityKwh: 8.6,
    sohText: '100% SOH (3,000 Cycle Life)',
    repackStatus: 'Factory SL Assembled Pack',
    corridor: 'Colombo Pettah Market - Fort Commercial Hub',
    cebTariffPlan: 'Commercial Rate D-1',
    climateVulnerability: 'Low-Speed High-Torque Stator Overload in Gridlock'
  },
  {
    id: 'SL-BYD-3045',
    plate: 'WP CBE-3045',
    name: 'BYD Atto 3 Extended Range',
    manufacturer: 'BYD',
    model: 'Atto 3 (Blade Battery)',
    year: 2025,
    type: 'SUV',
    batteryChemistry: 'LFP Blade (Active Liquid Loop)',
    packCapacityKwh: 60.48,
    sohText: '97% SoH',
    repackStatus: 'Factory Sealed OEM Pack',
    corridor: 'E01 Southern Expressway (Kottawa - Hambantota)',
    cebTariffPlan: 'General Purpose / DC Fast Chg',
    climateVulnerability: 'High-Speed Saline Coastal Ingress at 100km/h'
  },
  {
    id: 'SL-BUS-1904',
    plate: 'CP NA-1904',
    name: 'Lanka Ashok Leyland Dipper e-Bus',
    manufacturer: 'Lanka Ashok Leyland / SLTB',
    model: 'Dipper EV Intercity Express',
    year: 2024,
    type: 'BUS',
    batteryChemistry: 'Heavy-Duty Modular LFP',
    packCapacityKwh: 160.0,
    sohText: '94% SoH',
    repackStatus: 'Dual 80kWh Modular Sub-Packs',
    corridor: 'A1 Colombo - Kandy (Kadugannawa Pass Incline)',
    cebTariffPlan: 'Industrial Heavy Demand TOU',
    climateVulnerability: 'Kadugannawa Incline Overheating & Mountain Descent Regen Spike'
  },
  {
    id: 'SL-HYU-4210',
    plate: 'WP CAD-4210',
    name: 'Hyundai Ioniq Electric',
    manufacturer: 'Hyundai',
    model: 'Ioniq Electric (38.3kWh)',
    year: 2020,
    type: 'CAR',
    batteryChemistry: 'NMC Pouch Cells',
    packCapacityKwh: 38.3,
    sohText: '88% SoH',
    repackStatus: 'Original Factory Pack',
    corridor: 'A5 Peradeniya - Nuwara Eliya Highlands',
    cebTariffPlan: 'Domestic TOU',
    climateVulnerability: 'Thermal Shock (35°C Lowland -> 14°C Highland Shift)'
  }
];

interface VehicleState {
  selectedVehicleId: string;
  selectedVehicle: SriLankanVehicle;
  fleet: SriLankanVehicle[];
  setSelectedVehicleId: (id: string) => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  selectedVehicleId: 'SL-LEAF-7429',
  selectedVehicle: SRI_LANKAN_FLEET[0],
  fleet: SRI_LANKAN_FLEET,
  setSelectedVehicleId: (id: string) => {
    const found = SRI_LANKAN_FLEET.find(v => v.id === id) || SRI_LANKAN_FLEET[0];
    set({ selectedVehicleId: id, selectedVehicle: found });
  }
}));
