const os = require('os');

const getAllIPv4Addresses = () => {
    const interfaces = os.networkInterfaces();
    const allAddresses = [];
    for (const interface of Object.keys(interfaces)) {
        for (const iface of interfaces[interface]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                allAddresses.push({interface, address: iface.address});
            }
        }
    }
    return allAddresses;
};

const ips = {
    last: 0,
    main_in_next: true,
    list:
        [ '83.222.19.75' ] // [ '83.222.19.75', '83.222.17.116', '90.156.169.220' ]
        // getAllIPv4Addresses().map(item => item.address)
};

/** @param {'next'|'main'} type  */
function getIp(type) {
    if (type === 'main') return ips.list[0];
    
    let index = ips.last + 1;
    if (index > ips.list.length-1) index = Number(!ips.main_in_next);
    ips.last = index;

    return ips.list[index];
}

module.exports = { ips, getIp };