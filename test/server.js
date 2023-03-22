const http = require('http');

function createServer (port) {
  return new Promise(function (resolve, reject) {
    const mockData = {
      requests: [],
      listener: null,
      attach: function (listener) {
        this.requests = [];
        this.listener = listener;
      },
      collect: function () {
        const result = this.requests;
        this.requests = [];
        return result;
      }
    };

    mockData.server = http.createServer(function (request, response) {
      const data = [];
      let length = 0;
      request.on('data', function (chunk) {
        data.push(chunk);
        length += chunk.length;
      });
      request.on('end', function () {
        try {
          const requestData = {
            method: request.method,
            path: request.url,
            headers: request.headers,
            data: Buffer.concat(data, length),
          };
          mockData.requests.push(requestData);
          const responseData = mockData.listener && mockData.listener(requestData);
          if (response) {
            response.writeHead(responseData.status || 200, responseData.headers || {});
            const data = typeof responseData.data === 'string'
              ? responseData.data
              : responseData.data
                ? JSON.stringify(responseData.data)
                : undefined
            response.end(data);
          } else {
            response.end();
          }
        } catch (error) {
          response.end();
        }
      });
    }).listen(port, function () {
      resolve(mockData);
    });
  });
}

module.exports = { createServer };
