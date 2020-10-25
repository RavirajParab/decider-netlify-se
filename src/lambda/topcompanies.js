const {getRSIForAllTopCompanies} = require("../utilities");
exports.handler = async (event, context) => {
    const topCompanies = await getRSIForAllTopCompanies();
  return {
    statusCode: 200,
    body: JSON.stringify(topCompanies)
  };
};
