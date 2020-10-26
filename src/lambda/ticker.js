const {SetupTicker} = require("../tickerutil");
exports.handler = async (event, context) => {
    const quotes = await SetupTicker();
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(quotes)
  };
};
