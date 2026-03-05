const { WebcastPushConnection } = require('tiktok-live-connector');
try {
    const conn = new WebcastPushConnection('test');
    console.log('Methods:', Object.keys(conn));
    console.log('Prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(conn)));
} catch (e) {
    console.error('Failed to inspect:', e);
}
