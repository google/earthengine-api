const fn = require('./function');

const req = {
  query: {
    minLng: -124.848974,
    minLat: 24.396308,
    maxLng: -66.885444,
    maxLat: 49.384358
  }
};

const res = {
  set: function() {},
  send: function(data) {
    console.info(data);
    process.exit(0);
  }
};

fn.hexPopHttp(req, res);
