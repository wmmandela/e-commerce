const app = require('../backend/server');

module.exports = async (request, response) => {
  await app.ready;

  const requestUrl = new URL(request.url, 'http://localhost');
  const apiPath = requestUrl.searchParams.get('path');
  if (apiPath) {
    requestUrl.searchParams.delete('path');
    const query = requestUrl.searchParams.toString();
    request.url = `/api/${apiPath}${query ? `?${query}` : ''}`;
  }

  return app(request, response);
};
