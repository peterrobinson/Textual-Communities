var _ = require('lodash');

var env = process.env.NODE_ENV;

module.exports = _.assign({
  env: env,
  BACKEND_URL: 'http://localhost:3000/api/',
  IMAGE_UPLOAD_URL: 'http://localhost:3000/api/upload/',
  COLLATE_URL: 'http://localhost:8080',
  IIIF_URL: 'http://localhost:3000/app/data/tcimages/',
  TCIMAGE_STORAGE: '/Volumes/Macintosh HD/Users/pmr906/venv/TCangular/tc/public/app/data/tcimages',
  host_url: 'http://localhost:3000',
  authority: 'usask', 
}, require('./' + env + '.js'));


//  IIIF_URL: 'http://localhost:3000/app/data/tcimages/',
