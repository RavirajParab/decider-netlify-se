const {getMMI} = require("../utilities");
exports.handler = async (event, context) => {
    const mmi = await getMMI();
  return {
    statusCode: 200,
    body: JSON.stringify(mmi)
  };
};
