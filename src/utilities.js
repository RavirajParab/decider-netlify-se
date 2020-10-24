import fetch from "node-fetch";
const { RSI } = require("technicalindicators");
const fixToDecimal=(data)=>{
  if(data){
      return Number(data.toFixed(2));
  }
  else{
      return 0;
  }
}
const calculateRSI=(i,lq)=>{
  const prevClosings= i.historical.map(m=>m.lp);
  prevClosings.push(lq.price);
  const itemsToBeRemoved = prevClosings.length - 15;
  prevClosings.splice(0, itemsToBeRemoved);
  const inputRSI = {
      values: prevClosings,
      period: 14,
    };
  const RSIcal =RSI.calculate(inputRSI)[0]
  return RSIcal;
}

const getChange=(i,lq)=>{
  const currPrice = lq.price;
  const yestPrice = i.historical[i.historical.length-1].lp;
  const change = currPrice/yestPrice;
  return fixToDecimal(change);
}

const getAVD = async () => {
  const url =
    "https://etmarketsapis.indiatimes.com/ET_Stats/getAllIndices?exchange=nse&sortby=value&sortorder=desc&pagesize=5000";
  const AVDPromise = await fetch(url);
  const AVDData = await AVDPromise.json();
  const AVD = AVDData.searchresult.find((i) => i.indexName == "Nifty 200");
  const AVDRatio =
    ((Number(AVD.advances) * 100) / 200).toFixed(2) + "% Bullish";
  return AVDRatio;
};

const getMMI = async () => {
  const RawMMIData = await fetch("https://api.tickertape.in/mmi/now");
  const MMIData = await RawMMIData.json();

  let data = MMIData.data;
  let Current =
    data.daily[0].value.toFixed(2) +
    " - " +
    ShowGreedAndFearLevel(data.daily[0].value);
  let Yesterday =
    data.lastDay.indicator.toFixed(2) +
    " - " +
    ShowGreedAndFearLevel(data.lastDay.indicator);
  let LastWeek =
    data.lastWeek.indicator.toFixed(2) +
    " - " +
    ShowGreedAndFearLevel(data.lastWeek.indicator);
  let LastMonth =
    data.lastMonth.indicator.toFixed(2) +
    " - " +
    ShowGreedAndFearLevel(data.lastMonth.indicator);
  let LastYear =
    data.lastYear.indicator.toFixed(2) +
    " - " +
    ShowGreedAndFearLevel(data.lastYear.indicator);
  return {
    Current,
    Yesterday,
    LastWeek,
    LastMonth,
    LastYear,
  };
};

const ShowGreedAndFearLevel = (MMILevel) => {
  if (MMILevel >= 70) {
    return "Extreme Greed";
  } else if (MMILevel > 52 && MMILevel < 70) {
    return "Greed";
  } else if (MMILevel >= 48 && MMILevel <= 52) {
    return "Neutral";
  } else if (MMILevel < 48 && MMILevel >= 29) {
    return "Fear";
  } else {
    return "Extreme Fear";
  }
};

const csvJSON = (csv) => {
  const lines = csv.split("\n");
  const result = [];
  let headers = lines[0].split(",");
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const currentline = lines[i].split(",");
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }
    result.push(obj);
  }
  return result;
};

const getUrl = (security, noOfDays) => {
  const current = Math.round(new Date() / 1000);
  const past = current - 86400 * noOfDays;
  return `https://query1.finance.yahoo.com/v7/finance/download/${security}.NS?period1=${past}&period2=${current}&interval=1d&events=history`;
};

const getSecDataForDays = async (securityName, noOfDays) => {
  const url = getUrl(securityName, noOfDays);
  const response = await fetch(url);
  const text = await response.text();
  return csvJSON(text);
};

const getTop200Companies = async () => {
  const url = `https://www1.nseindia.com/content/indices/ind_nifty200list.csv`;
  const response = await fetch(url);
  const text = await response.text();
  return csvJSON(text);
};

const invertedGreenHammer = (data) => {
  const candleWidth = data.Close - data.Open;
  const totalWidth = data.High - data.Low;
  const hammerStrength = totalWidth / candleWidth;
  if (
    hammerStrength > 3.5 &&
    candleWidth > 0 &&
    data.Open / data.Low < 1.017 &&
    data.Close / data.Open > 1.0077
  ) {
    console.log(`${data.Date} formed InvertedGreenHammer`);
  }
};

const greenHammer = (data) => {
  const candleWidth = data.Close - data.Open;
  const totalWidth = data.High - data.Low;
  const hammerStrength = totalWidth / candleWidth;
  if (
    hammerStrength > 3.5 &&
    candleWidth > 0 &&
    data.High / data.Close < 1.017 &&
    data.Close / data.Open > 1.0077
  ) {
    console.log(`${data.Date} formed GreenHammer`);
  }
};

const redHammer = (data) => {
  const candleWidth = data.Open - data.Close;
  const totalWidth = data.High - data.Low;
  const hammerStrength = totalWidth / candleWidth;
  if (
    hammerStrength > 3.5 &&
    candleWidth > 0 &&
    data.High / data.Open < 1.017 &&
    data.Open / data.Close > 1.0077
  ) {
    console.log(`${data.Date} formed RedHammer`);
  }
};

const invertedRedHammer = (data) => {
  const candleWidth = data.Open - data.Close;
  const totalWidth = data.High - data.Low;
  const hammerStrength = totalWidth / candleWidth;
  if (
    hammerStrength > 3.5 &&
    candleWidth > 0 &&
    data.Close / data.Low < 1.017 &&
    data.Open / data.Close > 1.0077
  ) {
    console.log(`${data.Date} formed InvertedRedHammer`);
  }
};

const MatchPatterns = [
  invertedRedHammer,
  redHammer,
  greenHammer,
  invertedGreenHammer,
];

const getSecRSI = async (symbol) => {
  const data = await getSecDataForDays(symbol, 30);
  const itemsToBeRemoved = data.length - 15;
  data.splice(0, itemsToBeRemoved);
  const closings = data.map((i) => i.Close);
  const inputRSI = {
    values: closings,
    period: 14,
  };
  const currentData = data[14];
  if (currentData) {
    return {
      Symbol: symbol,
      RSI: RSI.calculate(inputRSI)[0],
      Date: currentData.Date,
      Open: currentData.Open,
      Close: currentData.Close,
      PreviousClose: data[13].Close,
      YesterdayChange :Number(
        (((data[13].Close - data[12].Close) * 100) / data[12].Close).toFixed(
          2
        )
      ),
      Change: Number(
        (((currentData.Close - data[13].Close) * 100) / data[13].Close).toFixed(
          2
        )
      ),
      Change14: Number(
        (((currentData.Close - data[0].Close) * 100) / data[0].Close).toFixed(2)
      ),
      Change5: Number(
        (((currentData.Close - data[10].Close) * 100) / data[10].Close).toFixed(
          2
        )
      ),
      Low: currentData.Low,
      High: currentData.High,
      Volume: currentData.Volume,
    };
  }
};

const getRSIForAllTopCompanies = async () => {
  const allTop200Companies = await getTop200Companies();
  const allTopRSIPromise = allTop200Companies.map((i) => getSecRSI(i.Symbol));
  const rsiData = await Promise.all(allTopRSIPromise);
  return rsiData;
};

const getQuote = async (req) => {
  const url = `https://quotes-api.tickertape.in/quotes?sids=${req.query.sid}`;
  const resprom = await fetch(url);
  const res = await resprom.json();
  return res.data;
};

const getNiftyHundredETData = async ()=>{
  const url = `https://json.bselivefeeds.indiatimes.com/ET_Community/liveindices?outputtype=json&indexid=2510&exchange=50&company=true&pagesize=100&sortby=percentchange&sortorder=desc`;
  const resprom = await fetch(url);
  const res = await resprom.json();
  return res.searchresult.response;
}

const getNiftyETFData =async ()=>{
  /* OLD CODE : DON NOT DELETE , FROM ET SITE
  const rawData = await fetch('https://json.bselivefeeds.indiatimes.com/ET_Community/MFJsonController?pagesize=25&exchange=50&pageno=1&sortby=percentchange&sortorder=desc&marketcap=&filtervalue=all&category=all&callback=ajaxResponse');
  const data = await rawData.text();
  let modifiedText = data.replace(/[()]/g,'').replace('ajaxResponse','');
  const result = JSON.parse(modifiedText);
  return result.searchresult;
  */
 const ETFS=['N100','GBES','NBES','SBIF','NIPD','JBES','ICIV','NTFM'];
        const ETFSPromArr = ETFS.map(i=>{
            return fetch(`https://api.tickertape.in/stockwidget/internal/${i}`);
        });

        const quotes=await fetch(`https://quotes-api.tickertape.in/quotes?sids=${ETFS.join(',')}`)
        const quotesData = await quotes.json();
        const liveETFQuotes=quotesData.data;

        const ETFSResolved= await Promise.all(ETFSPromArr);
        const ETFResolvedData = await Promise.all(ETFSResolved.map(i=>i.json()));
        const ETFSFullData=ETFResolvedData.map(i=>i.data);
        const ETFData=ETFSFullData.map((i,index)=>{
            const lq=liveETFQuotes[index];
            return {
                name :i.info.name,
                oname :ETFS[index],
                ticker: i.info.ticker,
                yhi: i.ratios['52wHigh'],
                ylo: i.ratios['52wLow'],
                beta: fixToDecimal(i.ratios.beta),
                mcap: fixToDecimal(i.ratios.marketCap),
                asset: fixToDecimal(i.ratios.asstUnderMan),
                yrt: fixToDecimal(i.ratios.returns['1y']),
                mrt: fixToDecimal(i.ratios.returns['1m']),
                price: lq.price,//i.historical[i.historical.length-1].lp,
                vol: lq.vol,//i.historical[i.historical.length-1].v
                rsi: calculateRSI(i,lq),
                change: getChange(i,lq)
            }  
        });
    return ETFData;
}

module.exports = {
  getAVD,
  getMMI,
  getQuote,
  getRSIForAllTopCompanies,
  getNiftyHundredETData,
  getNiftyETFData
};
