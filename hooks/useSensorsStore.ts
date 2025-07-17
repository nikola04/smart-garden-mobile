import { SensorData } from "types/sensors";
import { create } from "zustand";

interface ISensorsState {
    data: SensorData | null;
    lastUpdated: number;
    setData: (data: SensorData) => void;
}

export const useSensorStore = create<ISensorsState>((set) => ({
    data: null,
    lastUpdated: 0,
    setData: (data) => set({
        data,
        lastUpdated: Date.now()
    })
}))
