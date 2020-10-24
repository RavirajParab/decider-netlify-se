const {getAVD} = require("../utilities");
exports.handler = async (event, context) => {
  const avd = await getAVD();
  return {
    statusCode: 200,
    body: avd
  };
};
