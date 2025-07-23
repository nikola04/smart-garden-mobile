const deviceService= {
    uuid: '5C885D90-2726-4368-A12D-342D26C1C99A',
    characteristics: {
        system: {
            uuid: '1EA6DA5B-3DC4-4495-8E8F-05A7B727679D',
            desc: 'sleep and restart controlls'
        },
        device: {
            uuid: '57C1288C-B1A8-44BC-AABD-1D94F987BE97',
            desc: 'device data, wifi and others...'
        },
        sensors: {
            uuid: '78B32B3B-DA18-43BB-B56D-4773BA5DDBD1',
            desc: 'connected sensors data'
        },
        wifi: {
            uuid: '45DC0F38-9C98-4B8A-A49A-5C8542E63E44',
            desc: 'wifi scan'
        }
    }
}

export const config = {
    bleServices: {
        deviceService
    },
};
