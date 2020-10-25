const {getRSIForAllTopCompanies} = require("../utilities");
exports.handler = async (event, context) => {
    const topCompanies = await getRSIForAllTopCompanies();
  return {
    statusCode: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
    body: JSON.stringify(topCompanies)
  };
};
