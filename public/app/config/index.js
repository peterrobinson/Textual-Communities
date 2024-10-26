var _ = require('lodash');

var env = process.env.NODE_ENV;

module.exports = _.assign({
  env: env,
  BACKEND_URL: 'https://textualcommunities.com/api/',
  IMAGE_UPLOAD_URL: 'http://www.textualcommunities.org/api/upload/',
  COLLATE_URL: 'http://localhost:8080',
  IIIF_URL: 'http://www.textualcommunities.org:5004/',
  host_url: 'https://textualcommunities',
  authority: 'usask', 
}, require('./' + env + '.js'));
