const allowedServiceUUIDs = [
    '5C885D90-2726-4368-A12D-342D26C1C99A'
];

const characteristic = {
    device: {
        uuid: '57C1288C-B1A8-44BC-AABD-1D94F987BE97'
    },
    sensors: {
        uuid: '78B32B3B-DA18-43BB-B56D-4773BA5DDBD1'
    },
    wifi: {
        uuid: '45DC0F38-9C98-4B8A-A49A-5C8542E63E44'
    }
}

const bleReconnect = {
    attempts: 5,
    delay: 2000
}

export const config = {
    allowedServiceUUIDs,
    characteristic,
    bleReconnect
};
