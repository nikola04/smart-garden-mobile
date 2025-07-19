import { WiFiNetwork } from "types/wifi";
import { create } from "zustand";

interface IWiFiScanState {
    data: WiFiNetwork[];
    resetData: () => void;
    addData: (data: WiFiNetwork) => void;
}

export const useWiFiScanStore = create<IWiFiScanState>((set) => ({
    data: [],
    resetData: () => set({ data: [] }),
    addData: (newData) => set((state) => ({ data: [...state.data, newData]}))
}))
