const Router = require('express').Router;

const {getBindings, registerBind, sendNotification} = require('./notification_handler');
const tokenGenerator = require('./token_generator');
const config = require('./config');

const request = require('request');
const fs = require('fs');

const router = new Router();

// Convert keys to camelCase to conform with the twilio-node api definition contract
const camelCase = require('camelcase');
function camelCaseKeys(hashmap) {
  const newhashmap = {};
  Object.keys(hashmap).forEach(function(key) {
    const newkey = camelCase(key);
    newhashmap[newkey] = hashmap[key];
  });
  return newhashmap;
};

router.get('/token/:id?', (req, res) => {
  const id = req.params.id;
  res.send(tokenGenerator(id));
});

router.post('/token', (req, res) => {
  const id = req.body.id;
  res.send(tokenGenerator(id));
});

router.get('/bindings', (req, res) => {
  const filter = camelCaseKeys(req.body);
  getBindings(filter).then((data) => {
    res.status(data.status);
    res.send(data.data);
  })
});

router.post('/register', (req, res) => {
  const content = camelCaseKeys(req.body);
  registerBind(content).then((data) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(data.status);
    res.send(data.data);
  });
});

router.post('/send-notification', (req, res) => {
  const content = camelCaseKeys(req.body);
  sendNotification(content).then((data) => {
    res.status(data.status);
    res.send(data.data);
  });
});

router.get('/messenger_code', function(req, res) {
  const ref = req.query['referrer'] || 'myAdReferrer';
  const imagePath = 'public/notify/messenger_code_' + ref + '.png'
  // if (!fs.existsSync(imagePath)) {
  console.log(process.env.FB_PAGE_ACCESS_TOKEN)
  request.post('https://graph.facebook.com/v2.6/me/messenger_codes?access_token=' + process.env.FB_PAGE_ACCESS_TOKEN,
    {json: true,
      body: {
        type: 'standard',
        data: {
          'ref': ref
        }
      }
    }, (err, resp, body) => {
      if (err) {
        return console.log(err);
      }
      console.log(body.uri);
      const stream = request(body.uri).pipe(fs.createWriteStream(imagePath))
      stream.on('finish', function() {
        fs.createReadStream(imagePath).pipe(res)
      })
    });
  // } else {
  //   fs.createReadStream(imagePath).pipe(res)
  // }
});

router.get('/config', (req, res) => {
  res.json(config);
});

// Create a facebook-messenger binding based on the authentication webhook
router.post('/messenger_auth', function(req, res) {
  // Extract the request received from Facebook
  const message = req.body.entry[0].messaging[0];
  console.log(message);
  // Set user identity using their fb messenger user id
  let identity = null;
  if (message.sender) {
    identity = message.sender.id;
  } else if (message.recipient) {
    identity = message.recipient.id
  }
  // Let's create a new facebook-messenger Binding for our user
  const binding = {
    "identity": identity,
    "bindingType": 'facebook-messenger',
    "address": identity
  };
  if (message.referral) {
    binding.tag = message.referral.ref;
  } else if (message.postback && message.postbank.referral) {
    binding.tag = message.postback.referral.ref;
  } else if (message.optin && message.optin.ref) {
    binding.tag = message.optin.ref;
  }
  registerBind(camelCaseKeys(binding)).then((data) => {
    res.status(data.status);
    res.send(data.data);
  });
});

// Verification endpoint for Facebook needed to register a webhook.
router.get('/messenger_auth', function(req, res) {
  console.log(req.query["hub.challenge"]);
  res.send(req.query["hub.challenge"]);
});

module.exports = router;
