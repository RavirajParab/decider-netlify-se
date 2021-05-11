import fetch from "node-fetch";
import lodash from "lodash";
const { RSI } = require("technicalindicators");
const {SMA} =require('technicalindicators');
const rsiPeriod=14;

const fixToDecimal = (data) => {
  if (data) {
    return Number(data.toFixed(2));
  }
  else {
    return 0;
  }
}
const calculateRSI = (i, lq) => {
  const prevClosings = i.historical.map(m => m.lp);
  prevClosings.push(lq.price);
  const itemsToBeRemoved = prevClosings.length - 15;
  prevClosings.splice(0, itemsToBeRemoved);
  const inputRSI = {
    values: prevClosings,
    period: 14,
  };
  const RSIcal = RSI.calculate(inputRSI)[0]
  return RSIcal;
}

const getChange = (i, lq) => {
  const currPrice = i.price;
  const yestPrice = lq.c//i.historical[i.historical.length-1].lp;
  const change = currPrice / yestPrice;
  return change;
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
  const data = await getSecDataForDays(symbol, 45);
  const itemsToBeRemoved = data.length - 15;
  //save the month data
  const monthData =[...data];
  monthData.pop();
  const mitemsToBeRemoved = monthData.length - 30;
  monthData.splice(0, mitemsToBeRemoved);
  const pMClosings = monthData.map((i) => Number(i.Close));
  
  const pASMA5=SMA.calculate({period : 5, values : pMClosings});
  const pASMA8=SMA.calculate({period : 8, values : pMClosings});
  const pASMA14=SMA.calculate({period : 14,  values : pMClosings});
  const pSMA5 =pASMA5[pASMA5.length-1];
  const pSMA8 =pASMA8[pASMA8.length-1];
  const pSMA14 =pASMA14[pASMA14.length-1];
  //monthly logic ends here
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
      pSMA5:Number(pSMA5.toFixed(2)),
      pSMA8:Number(pSMA8.toFixed(2)),
      pSMA14:Number(pSMA14.toFixed(2)),
      Date: currentData.Date,
      Open: currentData.Open,
      Close: currentData.Close,
      POpen :data[13].Open,
      PClose :data[13].Close,
      SSL:Math.abs((currentData.High -currentData.Close).toFixed(2)),
      BSL:Math.abs((currentData.Close -currentData.Low).toFixed(2)),
      LQTY : (100000/currentData.Close).toFixed(2),
      IR: Number((((currentData.Close- currentData.Open)*100)/currentData.Close).toFixed(2)),
      PIR: Number((((data[13].Close- data[13].Open)*100)/data[13].Close).toFixed(2)),
      PreviousClose: data[13].Close,
      PChange: Number(
        (((data[13].Close - data[12].Close) * 100) / data[12].Close).toFixed(
          2
        )
      ),
      Change: Number(
        (((currentData.Close - data[13].Close) * 100) / data[13].Close).toFixed(
          2
        )
      ),
      PChange14: Number(
        (((data[13].Close - data[0].Close) * 100) / data[0].Close).toFixed(2)
      ),
      Change14: Number(
        (((currentData.Close - data[0].Close) * 100) / data[0].Close).toFixed(2)
      ),
      PChange5: Number(
        (((data[13].Close  - data[9].Close) * 100) / data[9].Close).toFixed(
          2
        )
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
  const allTopRSIPromise = allTop200Companies.map(i =>getSecRSI(i.Symbol));
  const rsiData = await Promise.all(allTopRSIPromise);
  return rsiData;
};

const getForecastForSID = async (sid) => {
  const foreCastUrl = `https://api.tickertape.in/stocks/commentaries/${sid}?keys[]=forecasts`;
  const forcastProm = await fetch(foreCastUrl);
  const forecast = await forcastProm.json();
  const cleanForecast = {
    sid: sid,
    eps: forecast.data.forecasts.eps[0],
    price: forecast.data.forecasts.price[0],
    revenue: forecast.data.forecasts.revenue[0]
  }
  return cleanForecast;
}

const getForecasts = async () => {
  const nifty200url = `https://api.tickertape.in/indices/info/.NIFTY200`;
  const nifty200prom = await fetch(nifty200url);
  const nifty200Data = await nifty200prom.json();
  const top200sids = nifty200Data.data.constituents;
  const top200forcastProm = top200sids.map(i => getForecastForSID(i));
  const top200forcastRes = await Promise.all(top200forcastProm);
  //positiveon eps
  const top200forcastResClean = top200forcastRes.map(i => {
    if (i) {
      const data = {};
      if (i.eps) {
        data.eps = deriveMessageValues(i.eps.message)
      } else {
        data.eps = {
          forecast: 0,
          cagr3: 0
        };
      }
      if (i.price) {
        data.price = deriveMessageValues(i.price.message)
      } else {
        data.price = {
          forecast: 0,
          cagr3: 0
        };
      }
      if (i.revenue) {
        data.revenue = deriveMessageValues(i.revenue.message)
      } else {
        data.revenue = {
          forecast: 0,
          cagr3: 0
        };
      }
      data.sid = i.sid;
      return data;
    }
  });
  return top200forcastResClean;
}
const deriveMessageValues = (message) => {
  if (message) {
    return {
      forecast: Number(message.split('of ')[1].split('%')[0]),
      cagr3: Number(message.split('of ')[2].split('%')[0])
    }
  } else {
    return {
      forecast: 0,
      cagr3: 0
    };
  }
}


const getSBOppsForSID =async (sid)=>{
  const nif200Url = `https://api.tickertape.in/stocks/charts/intra/.${sid}`;
  const nifProm = await fetch(nif200Url);
  const nifData = await nifProm.json();
  const dataPoints = nifData.data[0].points;
  const inputRSI ={
      values : dataPoints.map(i=>i.lp),
      period:rsiPeriod
  }
  const result = RSI.calculate(inputRSI);
  const compositeRSIData = result.map((i,index)=>{
      return {
          RSI : i,
          TS : new Date(dataPoints[index+rsiPeriod].ts).toLocaleTimeString(),
          TSZ : dataPoints[index+rsiPeriod].ts,
          LP : dataPoints[index+rsiPeriod].lp
      }
  });
  const shortTingOpps = compositeRSIData.filter(i=>i.RSI>70).sort((a,b)=>b.LP-a.LP);
  const buyingOpps = compositeRSIData.filter(i=>i.RSI<28).sort((a,b)=>a.LP-b.LP);
 // const bestShortOp = shortTingOpps.sort((a,b)=>b.LP-a.LP);
  return({
      sid :sid,
      shortTingOpps:shortTingOpps.length>0?shortTingOpps[0]:{},
      buyingOpps:buyingOpps.length>0?buyingOpps[0]:{}
  });
  
}


const getSBOppsForSIDETF =async (sid)=>{
  const nif200Url = `https://api.tickertape.in/stocks/charts/intra/${sid}`;
  const nifProm = await fetch(nif200Url);
  const nifData = await nifProm.json();
  const dataPoints = nifData.data[0].points;
  const inputRSI ={
      values : dataPoints.map(i=>i.lp),
      period:rsiPeriod
  }
  const result = RSI.calculate(inputRSI);
  const compositeRSIData = result.map((i,index)=>{
      return {
          RSI : i,
          TS : new Date(dataPoints[index+rsiPeriod].ts).toLocaleTimeString(),
          TSZ : dataPoints[index+rsiPeriod].ts,
          LP : dataPoints[index+rsiPeriod].lp
      }
  });
  const shortTingOpps = compositeRSIData.filter(i=>i.RSI>70).sort((a,b)=>b.LP-a.LP);
  const buyingOpps = compositeRSIData.filter(i=>i.RSI<28).sort((a,b)=>a.LP-b.LP);
 // const bestShortOp = shortTingOpps.sort((a,b)=>b.LP-a.LP);
  return({
      sid :sid,
      shortTingOpps:shortTingOpps.length>0?shortTingOpps[0]:{},
      buyingOpps:buyingOpps.length>0?buyingOpps[0]:{}
  });
  
}


const getTiming = async ()=>{
  const indices=["NIFTY200","NIFTYAUTO","NIFTYPSU","NIFTYMED","NIFTYFIN","NSEBANK","NIFTYIT",
    "NIPHARM","NIFTYMET","NIFTYREAL","NIFTYFMCG"];
    const indicesData=indices.map(i=>getSBOppsForSID(i));
    const indicesDataRes = await Promise.all(indicesData);
    return indicesDataRes;
}


const getTimingETF = async ()=>{
  const indices=["BBES","NBES","GOMS","NIPD","PSUB","GBES"];
    const indicesData=indices.map(i=>getSBOppsForSIDETF(i));
    const indicesDataRes = await Promise.all(indicesData);
    return indicesDataRes;
}


const getQuote = async (req) => {
  const url = `https://quotes-api.tickertape.in/quotes?sids=${req.queryStringParameters.sid}`;
  const resprom = await fetch(url);
  const res = await resprom.json();

  const cosSIDs = req.queryStringParameters.sid.split(',');
  const DRSIProm = cosSIDs.map(n => {
    let myReq = {
      queryStringParameters: {
        sid: n
      }
    };
    return getLiveRSIDaywise(myReq);
  });
  const DRISData = await Promise.all(DRSIProm);
  const finalData = res.data.map((v, i) => {
    return {
      ...v,
      drsi: DRISData[i].RSI
    }
  });
  return finalData;
};


const getDRSI = async (req) => {
  const cosSIDs = req.queryStringParameters.sid.split(',');
  const DRSIProm = cosSIDs.map(n => {
    let myReq = {
      queryStringParameters: {
        sid: n
      }
    };
    return getLiveRSIDaywise(myReq);
  });
  const DRISData = await Promise.all(DRSIProm);
  return DRISData;
};


const calculateRise =(a,b)=>{
  return  Number((((a.lp-b.lp)*100)/a.lp).toFixed(2));
}

const getTrend=(dataPoints)=>{
  const index = dataPoints.length;
  const pStart=dataPoints[0];
  let p5min; let First5MinR;
  let p15min; let First15MinR;
  let p11am;  let FirstSessionR;
  let p1230pm; let SecondSessionR;
  let p2pm; let ThirdSessionR;
  let pLast; let FourthSessionR;
  if(index<6){
      First5MinR = calculateRise(dataPoints[index-1],pStart);
  }
  if(index>5){
      p5min = dataPoints[5];
      First5MinR = calculateRise(p5min,pStart);
      if(index<15){
          First15MinR = calculateRise(dataPoints[index-1],pStart);
      }
  }
  if(index>14){
      p15min = dataPoints[14];
      First15MinR = calculateRise(p15min,pStart);
      if(index<105){
          FirstSessionR = calculateRise(dataPoints[index-1],p15min);
      }
  }
  if(index>104){
      p11am = dataPoints[104];
      FirstSessionR = calculateRise(p11am,p15min);
      if(index<195){
          SecondSessionR = calculateRise(dataPoints[index-1],p11am);
      }
  }
  if(index>194){
      p1230pm = dataPoints[194];
      SecondSessionR = calculateRise(p1230pm,p11am);
      if(index<285){
          ThirdSessionR = calculateRise(dataPoints[index-1],p1230pm);
      }
  }
  if(index>284){
      p2pm=dataPoints[284];
      ThirdSessionR = calculateRise(p2pm,p1230pm);
      if(index<361){
          FourthSessionR = calculateRise(dataPoints[index-1],p2pm);
      }
  }
  if(index>360){
      pLast=dataPoints[284];
      FourthSessionR = calculateRise(dataPoints[index-1],p2pm);
  }
  return{
      First5MinR,
      First15MinR,
      FirstSessionR,
      SecondSessionR,
      ThirdSessionR,
      FourthSessionR
  }
}

const getLiveRSIDaywise = async (req) => {
  const timePeriodRSI = 14;
  const url = `https://api.tickertape.in/stocks/charts/intra/${req.queryStringParameters.sid}`;
  const rawData = await fetch(url);
  const data = await rawData.json();
  const finalData = data.data[0].points.filter(i=>i!==undefined);
  if(finalData.length>0){
    const trend = getTrend(finalData);
    const lp =finalData[finalData.length-1].lp;
    const sp = finalData[0].lp
    const IR = Number(((lp-sp)*100/lp).toFixed(2));
    const prices = finalData.map(i => i.lp);
    const inputRSI = {
      values: prices,
      period: timePeriodRSI
    };
    const RSIResult = RSI.calculate(inputRSI);
    const compositeData = RSIResult.map((i, index) => {
      const data = {
        RSI: i,
        IR : IR,
        Price: finalData[index + timePeriodRSI].lp,
        TS: (new Date(Date.parse(finalData[index + timePeriodRSI].ts))).toLocaleTimeString(),
        SID: req.queryStringParameters.sid,
        Trend : trend,
        action : finalData
      }
      return data;
    });
    return compositeData[compositeData.length - 1];
  }
}


const getLiveRSIDaywiseLite = async (req) => {
  const timePeriodRSI = 14;
  const url = `https://api.tickertape.in/stocks/charts/intra/${req.queryStringParameters.sid}`;
  const rawData = await fetch(url);
  const data = await rawData.json();
  const finalData = data.data[0].points.filter(i=>i!==undefined);
  if(finalData.length>0){
    const trend = getTrend(finalData);
    const lp =finalData[finalData.length-1].lp;
    const sp = finalData[0].lp
    const IR = Number(((lp-sp)*100/lp).toFixed(2));
    const prices = finalData.map(i => i.lp);
    const inputRSI = {
      values: prices,
      period: timePeriodRSI
    };
    const RSIResult = RSI.calculate(inputRSI);
    const compositeData = RSIResult.map((i, index) => {
      const data = {
        RSI: i,
        IR : IR,
        Price: finalData[index + timePeriodRSI].lp,
        tgtOrLS :Math.round(finalData[index + timePeriodRSI].lp*0.015),
        TS: (new Date(Date.parse(finalData[index + timePeriodRSI].ts))).toLocaleTimeString(),
        SID: req.queryStringParameters.sid,
        Trend : trend
      }
      return data;
    });
    return compositeData[compositeData.length - 1];
  }
  
}
const getNiftyHundredETData = async () => {
  const url = `https://json.bselivefeeds.indiatimes.com/ET_Community/liveindices?outputtype=json&indexid=2510&exchange=50&company=true&pagesize=100&sortby=percentchange&sortorder=desc`;
  const resprom = await fetch(url);
  const res = await resprom.json();
  return res.searchresult.response;
}

const getNiftyETFData = async () => {
  /* OLD CODE : DON NOT DELETE , FROM ET SITE
  const rawData = await fetch('https://json.bselivefeeds.indiatimes.com/ET_Community/MFJsonController?pagesize=25&exchange=50&pageno=1&sortby=percentchange&sortorder=desc&marketcap=&filtervalue=all&category=all&callback=ajaxResponse');
  const data = await rawData.text();
  let modifiedText = data.replace(/[()]/g,'').replace('ajaxResponse','');
  const result = JSON.parse(modifiedText);
  return result.searchresult;
  */
  const ETFS = ['N100', 'GBES', 'NBES', 'SBIF', 'NIPD', 'JBES', 'ICIV', 'NTFM'];
  const ETFSPromArr = ETFS.map(i => {
    return fetch(`https://api.tickertape.in/stockwidget/internal/${i}`);
  });

  const quotes = await fetch(`https://quotes-api.tickertape.in/quotes?sids=${ETFS.join(',')}`)
  const quotesData = await quotes.json();
  const liveETFQuotes = quotesData.data;

  const ETFSResolved = await Promise.all(ETFSPromArr);
  const ETFResolvedData = await Promise.all(ETFSResolved.map(i => i.json()));
  const ETFSFullData = ETFResolvedData.map(i => i.data);
  const ETFData = ETFSFullData.map(async (i, index) => {
    const lq = liveETFQuotes[index];
    const indexProm = await fetch(`http://clearnifty.com/chart/${i.info.ticker}/rsi/?xhr`);
    const data = await indexProm.json();
    const RSIData = data.text_analysis;

    return {
      name: i.info.name,
      oname: ETFS[index],
      ticker: i.info.ticker,
      yhi: i.ratios['52wHigh'],
      ylo: i.ratios['52wLow'],
      beta: fixToDecimal(i.ratios.beta),
      mcap: fixToDecimal(i.ratios.marketCap),
      asset: fixToDecimal(i.ratios.asstUnderMan),
      yrt: fixToDecimal(i.ratios.returns['1y']),
      mrt: fixToDecimal(i.ratios.returns['1m']),
      price: lq.price,//i.historical[i.historical.length-1].lp,
      rise: fixToDecimal((lq.price - i.ratios['52wLow']) * 100 / i.ratios['52wLow']),
      vol: lq.vol,//i.historical[i.historical.length-1].v
      rsi: RSIData,//calculateRSI(i, lq),
      change: fixToDecimal(lq.change * 100 / lq.c)
    }
  });
  const resolvedETFData = await Promise.all(ETFData);
  return resolvedETFData;
}

const getIndexData = async () => {
  const indexProm = await fetch('https://etmarketsapis.indiatimes.com/ET_Stats/getAllIndices?exchange=nse&pagesize=1000');
  const Data = await indexProm.json();
  const InSignificantIndexIDs = [14116, 13029, 14214, 13654, 13534, 15011, 13931, 14967, 13653, 13021, 13019, 15501, 14306, 2346, 14353, 14303, 2510, 13602, 2369, 2371, 2495, 2907, 13532];
  const indexData = Data.searchresult.map(i => {
    return {
      "IndexID": i.indexId,
      "IndexName": i.indexName,
      "IndexChange": i.perChange,
      "Bullishness": Number(i.advancesPerChange.toFixed(2)),
      "Rise": Number(((i.currentIndexValue - i.fiftyTwoWeekLowIndexValue) * 100 / i.fiftyTwoWeekLowIndexValue).toFixed(2)),
      "StocksUrl": `https://etmarketsapis.indiatimes.com/ET_Stats/getIndexByIds?indexid=${i.indexId}&pagesize=100`
    }
  })
    .filter(i => !InSignificantIndexIDs.includes(Number(i.IndexID)))
    .sort((a, b) => a.IndexChange - b.IndexChange);

  const fullIndexDataProm = indexData.map(async i => {
    const indexCosProm = await fetch(i.StocksUrl);
    const indexCosDataRaw = await indexCosProm.json();
    const indexCosData = indexCosDataRaw.searchresult;
    const data = {
      "IndexData": { ...i },
      "Companies": indexCosData[0].companies.map(n => {
        return {
          "Symbol": n.symbol,
          "Rise": Number(((n.current - n.fiftyTwoWeekLowPrice) * 100 / n.fiftyTwoWeekLowPrice).toFixed(2))
        }
      }).sort((a, b) => (a.Rise - b.Rise))
    }
    return data;
  });
  const fullIndexData = await Promise.all(fullIndexDataProm);
  return fullIndexData;
}

const getShortCandidates = async (sell = true) => {
  try {
    const indexProm = await fetch('https://etmarketsapis.indiatimes.com/ET_Stats/getAllIndices?exchange=nse&pagesize=1000');
    const Data = await indexProm.json();
    const indexData = Data.searchresult.map(i => {
      return {
        "IndexID": i.indexId,
        "IndexName": i.indexName,
        "IndexChange": i.perChange,
        "IndexAdvChange": i.advancesPerChange
      }
    }).sort((a, b) => a.IndexChange - b.IndexChange);

    //get the bad performing indices
    const illPerformingIndices = indexData.filter(i => {
      if (sell) {
        return i.IndexChange < 0;
      } else {
        return i.IndexChange > 0;
      }
    }).slice(0, 4)
    //get the companies of ill performing indices

    const illCompaniesPromise = illPerformingIndices.map(i => fetch(`https://etmarketsapis.indiatimes.com/ET_Stats/getIndexByIds?indexid=${i.IndexID}&pagesize=1000`));
    const illCompaniesPromRes = await Promise.all(illCompaniesPromise);
    const illCompaniesDataProm = illCompaniesPromRes.map(i => i.json());
    const illCompaniesFinalData = await Promise.all(illCompaniesDataProm);
    const companies = [];
    const illCompanies = illCompaniesFinalData.forEach(i => {
      const cosFiltered = i.searchresult[0].companies.filter(i => {
        if (sell) {
          return i.percentChange < 0;
        } else {
          return i.percentChange > 0;
        }
      });
      companies.push(...cosFiltered);
    });

    const finalData = companies.map(i => {
      return {
        "CompanyID": i.companyId,
        "Symbol": i.symbol,
        "Change": i.percentChange
      }
    }).sort((m, n) => {
      if (sell) {
        return m.Change - n.Change;
      } else {
        return n.Change - m.Change;
      }
    });
    const ShortfulCompanies = lodash.uniqBy(finalData, 'Symbol');
    return ShortfulCompanies;
  }
  catch (err) {
    throw err;
  }
}

const getDRSILite = async (req)=>{
  const cosSIDs = req.queryStringParameters.sid.split(',');
  const DRSIProm = cosSIDs.map(n => {
    let myReq = {
      queryStringParameters: {
        sid: n
      }
    };
    return getLiveRSIDaywiseLite(myReq);
  });
  const DRISData = await Promise.all(DRSIProm);
  return DRISData;
}


const getGlobalIndexData = async () => {
  try {
    const indexProm = await fetch('https://ewmw.edelweiss.in/api/Market/MarketsModule/MarketsIndices');
    const data = await indexProm.json();
    const gData = (JSON.parse(data)).JsonData;
    const globalIndicesData = gData.GI
    const USAIndex = globalIndicesData.America.filter(i => i.Coun === "United States");
    const EUIndex = globalIndicesData.Europe.filter(i => ((i.Coun === "United Kingdom") || (i.Coun === "France") || (i.Coun === "Germany")));
    const AsiaIndex = globalIndicesData.Asia.filter(i => ((i.Coun === "Japan") || (i.Coun === "Hong Kong") || (i.Coun === "Singapore")));
    const AllGlobalFiltered = [...USAIndex, ...EUIndex, ...AsiaIndex].map(i => {
      return {
        "Index": i.IName,
        "Change": i.PChng,
        "Region": i.Reg
      }
    }).reverse();
    return AllGlobalFiltered;
  }
  catch (err) {
    throw err;
  }
}

module.exports = {
  getAVD,
  getMMI,
  getQuote,
  getTiming,
  getRSIForAllTopCompanies,
  getNiftyHundredETData,
  getNiftyETFData,
  getShortCandidates,
  getIndexData,
  getGlobalIndexData,
  getLiveRSIDaywise,
  getForecasts,
  getDRSI,
  getDRSILite,
  getTimingETF
};
