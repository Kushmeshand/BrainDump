const https = require('https');

https.get('https://res.cloudinary.com/dtymwiwmj/image/upload/v1/some-pdf-url', (res) => {
  console.log(res.headers);
});
