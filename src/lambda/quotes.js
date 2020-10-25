const {getQuote} = require("../utilities");
exports.handler = async (event, context) => {
    const quotes = await getQuote(event);
  return {
    statusCode: 200,
    body: JSON.stringify(quotes)
  };
};
