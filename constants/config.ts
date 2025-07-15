const allowedServiceUUIDs = [
    '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
];

const characteristicUUIDs = {
    deviceConfigs: 'beb5483e-36e1-4688-b7f5-ea07361b26a8',
}

const bleReconnect = {
    attempts: 5,
    delay: 2000
}

export const config = {
    allowedServiceUUIDs,
    characteristicUUIDs,
    bleReconnect
};
