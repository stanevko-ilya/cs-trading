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
    list: getAllIPv4Addresses().map(item => item.address)
};

/** @param {'next'|'main'} type  */
function getIp(type) {
    if (type === 'main') return ips.list[0];
    
    let new_index = ips.last + 1;
    if (new_index > ips.list.length-1) new_index = 0;
    ips.last = new_index;

    return ips.list[new_index];
}

module.exports = getIp;