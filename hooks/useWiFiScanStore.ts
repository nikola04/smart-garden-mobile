import { WiFiNetwork, WiFiScanStatus } from "types/wifi";
import { create } from "zustand";

interface IWiFiScanState {
    data: WiFiNetwork[];
    status: WiFiScanStatus;
    resetData: () => void;
    addData: (data: WiFiNetwork) => void;
    setStatus: (status: WiFiScanStatus) => void;
}

export const useWiFiScanStore = create<IWiFiScanState>((set) => ({
    data: [],
    status: 'scanned',
    resetData: () => set({ data: [] }),
    addData: (newData) => set((state) => ({ data: [...state.data, newData]})),
    setStatus: (status) => set((state) => ({ ...state, status }))
}))
