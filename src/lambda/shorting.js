const {getShortCandidates} = require("../utilities");
exports.handler = async (event, context) => {
    const shortCandidates = await getShortCandidates();
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(shortCandidates)
  };
};
