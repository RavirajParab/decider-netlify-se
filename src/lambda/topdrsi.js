const {getTop200DRSI} = require("../utilities");
exports.handler = async (event, context) => {
    const drsiTop = await getTop200DRSI();
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(drsiTop)
  };
};
