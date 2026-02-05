const Event = require('../../../system/structures/Event');

module.exports = new Event({
  event: 'clientReady',
  once: true,
  run: (__client__, client) => {
    const took = ((Date.now() - (__client__?.login_timestamp || Date.now())) / 1000).toFixed(2);
    // console.log(`Logged in as ${client.user.displayName}, took ${took}s.`);
  },
}).toJSON();
