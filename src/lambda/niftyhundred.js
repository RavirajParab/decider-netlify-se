const {getNiftyHundredETData} = require("../utilities");
exports.handler = async (event, context) => {
    const niftyHundred = await getNiftyHundredETData();
  return {
    statusCode: 200,
    body: JSON.stringify(niftyHundred)
  };
};
