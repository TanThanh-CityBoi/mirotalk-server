const ServerApi = require('../common/ServerApi');
const Logger = require('../common/Logger');
const log = new Logger('Server');

async function AuthGuard(req, res, next) {
  const { host } = req.headers;
  const { authorization } = req.headers;
  const api = new ServerApi(host, authorization);
  if (!api.isAuthorized()) {
    log.debug('MiroTalk get meeting - Unauthorized', {
      header: req.headers,
      body: req.body,
    });
    return res.status(403).json({ error: 'Unauthorized!' });
  }
  res.locals.api = api;
  next();
}

module.exports = { AuthGuard };
