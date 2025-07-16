import { DeviceConfig } from "types/device";
import { create } from "zustand";

interface IDeviceState {
    data: DeviceConfig | null;
    lastUpdated: number;
    setData: (data: DeviceConfig) => void;
}

export const useDeviceStore = create<IDeviceState>((set) => ({
    data: null,
    lastUpdated: 0,
    setData: (data) => set({
        data,
        lastUpdated: Date.now()
    })
}))
