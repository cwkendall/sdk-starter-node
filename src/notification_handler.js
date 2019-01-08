const Twilio = require('twilio');

const config = require('./config');

/**
 * Create a device binding from a POST HTTP request
 *
 * @param {Object} binding
 *
 * @return {Promise}
 *         {Object.status}
 *         {Object.data}
 *                {Object.message}
 */
exports.registerBind = function registerBind(binding) {
  const service = getTwilioClient();

  return service.bindings.create(binding).then((binding) => {
    console.log(binding);
    // Send a JSON response indicating success
    return {
      status: 200,
      data: {message: 'Binding created!'},
    };
  }).catch((error) => {
    console.log(error);
    return {
      status: 500,
      data: {
        error: error,
        message: 'Failed to create binding: ' + error,
      },
    };
  });
};

exports.clearBindings = function clearBindings() {
  const service = getTwilioClient();
  const promises = [];
  return service.bindings.list().then((bindings) => {
    for (const binding of bindings) {
      promises.push(service.bindings(binding.sid).remove());
    }
    Promise.all(promises).then((result) => {
      return {
        status: 200,
        data: {message: 'Bindings deleted!'},
      }
    }).catch((error) => {
      console.log(error);
      return {
        status: 500,
        data: {
          error: error,
          message: 'Failed to delete bindings: ' + error,
        },
      };
    });
  }).catch((error) => {
    console.log(error);
    return {
      status: 500,
      data: {
        error: error,
        message: 'Unable to fetch bindings for deletion: ' + error,
      },
    };
  })
}

exports.getBindings = function getBindings(opts) {
  const service = getTwilioClient();

  return service.bindings.list(opts).then((list) => {
    const table = {
      'fields': [
        'Address',
        'Identity',
        'Binding Type',
        'Date Created',
        'Date Updated',
        'Tags'],
      'bindings': list.map((val) => {
        return [
          val.address,
          val.identity,
          val.bindingType,
          val.dateCreated,
          val.dateUpdated,
          val.tags];
      })}
    table.bindings.sort();
    // console.log(JSON.stringify(table));
    return {
      status: 200,
      data: table
    }
  }).catch((error) => {
    console.log(error);
    return {
      status: 500,
      data: {
        error: error,
        message: 'Failed to fetch bindings: ' + error,
      },
    };
  })
}

// Notify - send a notification from a POST HTTP request
exports.sendNotification = function sendNotification(notification) {
  // Create a reference to the user notification service
  const service = getTwilioClient();

  // Send a notification
  return service.notifications.create(notification).then((message) => {
    console.log(message);
    return {
      status: 200,
      data: {message: 'Successful sending notification'},
    };
  }).catch((error) => {
    console.log(error);
    return {
      status: 500,
      data: {error: error},
    };
  });
};

function getTwilioClient() {
  // Twilio Library
  const client = new Twilio(
    config.TWILIO_API_KEY,
    config.TWILIO_API_SECRET,
    {accountSid: config.TWILIO_ACCOUNT_SID}
  );

  // Get a reference to the user notification service instance
  const service = client.notify.services(
    config.TWILIO_NOTIFICATION_SERVICE_SID
  );

  return service;
}
