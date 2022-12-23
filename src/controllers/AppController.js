const ServerApi = require('../common/ServerApi');
const Logger = require('../common/Logger');
const log = new Logger('Server');

class AppController {
  meeting = async (req, res) => {

    // Setup meeting URL
    const api = res.locals.api;
    const meetingURL = api.getMeetingURL();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ meeting: meetingURL }));

    // Log.debug the output if all done
    log.debug('MiroTalk get meeting - Authorized', {
      header: req.headers,
      body: req.body,
      meeting: meetingURL,
    });
  };

  join = (req, res) => {

    // Setup Join URL
    const api = res.locals.api;
    const joinURL = api.getJoinURL(req.body);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ join: joinURL }));
    
    // Log.debug the output if all done
    log.debug('MiroTalk get join - Authorized', {
      header: req.headers,
      body: req.body,
      join: joinURL,
    });
  };
}

module.exports = new AppController();
