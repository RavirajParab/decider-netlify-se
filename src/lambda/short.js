const {AllShorting} = require("../mongoUtil");
exports.handler = async (event, context) => {
    const companies = await AllShorting(event);
  return {
    statusCode: 200,
    body: JSON.stringify(companies)
  };
};
