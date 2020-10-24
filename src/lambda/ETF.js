const {getNiftyETFData} = require("../utilities");
exports.handler = async (event, context) => {
    const etfData = await getNiftyETFData();
  return {
    statusCode: 200,
    body: etfData
  };
};
