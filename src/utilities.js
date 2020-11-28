import fetch from "node-fetch";
import lodash from "lodash";
const { RSI } = require("technicalindicators");
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
      YesterdayChange: Number(
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

const getTop200DRSI = async () => {
  const nifty200url = `https://api.tickertape.in/indices/info/.NIFTY200`;
  const nifty200prom = await fetch(nifty200url);
  const nifty200Data = await nifty200prom.json();
  const top200sids = nifty200Data.data.constituents;
  const top200drsiProm = top200sids.map(i => {
    let myReq = {
      queryStringParameters: {
        sid: i
      }
    };
    return getLiveRSIDaywise(myReq);
  });
  const top200drsiRes = await Promise.all(top200drsiProm);
  return top200drsiRes;
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

const getLiveRSIDaywise = async (req) => {
  const timePeriodRSI = 14;
  const url = `https://api.tickertape.in/stocks/charts/intra/${req.queryStringParameters.sid}`;
  const rawData = await fetch(url);
  const data = await rawData.json();
  const finalData = data.data[0].points;
  const prices = finalData.map(i => i.lp);
  const inputRSI = {
    values: prices,
    period: timePeriodRSI
  };
  const RSIResult = RSI.calculate(inputRSI);
  const compositeData = RSIResult.map((i, index) => {
    const data = {
      RSI: i,
      Price: finalData[index + timePeriodRSI].lp,
      TS: (new Date(Date.parse(finalData[index + timePeriodRSI].ts))).toLocaleTimeString(),
      SID: req.queryStringParameters.sid
    }
    return data;
  });
  return compositeData[compositeData.length - 1];
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
const getInternalData = async (sec) => {
  try {
    const urlData = await fetch(`https://api.tickertape.in/stockwidget/internal/${sec.sid}`);
    const rawData = await urlData.json();
    const data = rawData.data;
    const secData = {
      name: data.info.name,
      ticker: data.info.ticker,
      sector: data.info.gic.sector,
      yearHigh: data.ratios['52wHigh'],
      yearLow: data.ratios['52wLow'],
      pe: fixToDecimal(data.ratios.pe),
      beta: fixToDecimal(data.ratios.beta),
      mcap: data.ratios.marketCap,
      monthReturns: fixToDecimal(data.ratios.returns['1m']),
      yearReturns: fixToDecimal(data.ratios.returns['1y']),
      historical: data.historical,
      quote: sec
    }
    return secData;
  } catch (err) {
    console.log(`Failed for `, sec.sid);
  }
}

const getAllQuotes = async () => {
  const allQuotesProm = await fetch(`https://quotes-api.tickertape.in/quotes?sids=ADIA,AFFL,ADRG,ARTI,ACC,ADNA,ADAI,ADEN,ADTB,APSE,ABB,AEGS,ADEL,TMIN,ABOT,AIAE,ADAG,AVAS,AMAR,AJPH,ALKY,APLO,AMBE,ABUJ,ALKE,ALMC,ACLL,ALEM,APLH,AKZO,ALOK,APLA,ABDL,ASTR,ASPT,ATRD,ATLP,AXBK,ARBN,ASPN,AUFI,AVNT,ASOK,BARA,BFRG,BACO,BJFS,BRGR,BATA,BAJA,BLKI,BLMR,BACH,BANH,BEML,BOI,BOB,BBRM,BJFN,BAYE,BJEL,BJAT,BASF,BAJE,BDYN,BRIG,BLIS,BIRS,BLDT,BRIT,BION,BRLC,CNFH,BHEL,BOSH,BRTI,BLUS,BSEL,BRSN,CNBK,BPCL,CADI,CNTP,CENA,CAPG,CHAL,CRBR,CEAT,CESC,CREI,CIPL,CAPL,CCLP,COAL,CNTY,CORF,CAST,CHPC,COFO,COLG,CCRI,CHOL,COCH,CBI,CHMB,CHLA,CERA,DABU,CYIE,DALB,DPNT,CUMM,DELT,CSBB,DIBL,DSHM,DHNP,CRSL,CROP,DBCL,DCMS,CRDE,CTBK,DCBA,AVEU,DLF,ELGE,DSTV,DIXO,ECLE,EIHO,EIDP,EDEL,REDY,EMAM,DIVI,EICH,GUJL,ENGI,FNXC,FTRE,FINX,ESAB,ESCO,FRTL,GAME,GAIL,ERIS,FOHE,FISO,FED,FINO,EQHL,ENDU,FDC,ESSL,EXID,GMMP,GEPO,GRWL,GHCH,GDFR,GALX,GODE,GILE,GLEN,GNFC,GENA,GESC,GMDC,GOCP,GMRI,GLAX,GODI,GODR,HIAE,GRAN,GRNN,GRSE,HAPL,GSPT,GGAS,HVEL,GALK,GOLU,GRAS,GSFC,HAWY,GPPL,GRPH,GRVL,HALC,HUDC,HPCL,HDFC,HZNC,HDBK,INRL,HDFL,HCPR,HIMD,INBF,HCLT,HEFI,HLL,HEGL,HFCL,HROM,HDFA,HEID,HONE,ICBK,VODA,IDBI,IDFB,IFBI,IGAS,ICMN,INBA,INDB,ICIL,IDFC,INGL,INRM,ICIR,IIFL,IHTL,IIFW,IIAN,ICRA,INMR,IFIB,IRCN,IOLC,ITEL,JKBK,INIR,ICCI,ITC,BHRI,IOBK,INGR,JAGP,INFY,JAIC,INBK,IRBI,JMNA,INOL,IOC,IPCA,JIST,JUBI,KANE,JIND,JKCE,JSTL,JUST,JCHA,JSWE,JYOI,JINA,JBCH,JKLC,JTEK,KAPT,JMSH,KAJR,JKIN,JNSP,JKPA,KEIN,KTKM,KARU,KECL,KNRL,KOLT,KRBL,LAOP,LART,DLPA,LUXI,MMFS,LRTI,LAUL,LKMC,KSBL,LIND,KVRI,LICH,MAHM,KBNK,LEMO,LTEH,LTFH,LUPN,MCEI,MRCO,MHSC,MHSM,BMBK,MALO,MNFL,UNSP,MRTI,MASF,METP,MOIL,MMTC,MOSS,MRPL,MINT,MAXI,MAHH,MINC,MOFS,MBFL,MISR,MRF,MNDA,MGAS,NHPC,NAVN,NBCC,NARY,NAFL,NALU,NATP,NAFT,MUTT,NIPF,NCCL,NEST,INED,NSEN,THEE,NOCI,OILI,ORCL,ORCE,NMDC,ONGC,NLCI,OEBO,ORRE,NKML,NTPC,ONTE,OMAX,PAGE,PWFC,PIRA,PROC,PHOE,PIDI,PLNG,PERS,HUHT,PNBK,PROR,PHIL,PIIL,PFIZ,PNBH,PREG,PGRD,PNCI,ABBW,PSPP,PRAJ,PLYP,POLC,PVRL,QUEC,PRIS,PLMD,PTCI,RADC,RATB,RYMD,RELI,RITS,REXP,RSTC,RLXO,RALL,REDI,RECM,RAID,TRCE,RMT,SAIL,SBIC,RAIV,SANO,SBI,SCHE,SHOP,SEIN,SHEF,SHME,SHCM,SBIL,SEQU,SCI,SHCU,SLIN,SPRC,SIEM,SIBK,SECR,SKFB,SOBH,SOLA,SJVN,SOFT,STAT,SRTR,SDCH,SNFN,SUNT,SUN,SUPE,SPJT,SUMH,SUTV,SRFL,SNFS,SRID,STTE,SUPI,SPTL,TTPW,TTEX,TISC,SUVH,TABE,SYMP,TTCH,SUZL,TATA,TAMdv,TATS,TCNS,TCIE,STEN,SWAR,TACO,SYNN,TACN,TAMO,SWAN,TCS,TINV,TLSV,TEML,TITN,TOPO,TRIE,THYO,TVEB,THMX,TVTO,UCBK,TTKL,TORP,TVSM,UBBW,TREN,TBEI,TIMK,UJVF,UJJI,UPLL,VARB,ULTC,VGUA,UNBK,VENK,VAKR,UFLX,VAIB,VARE,WHIR,WGSR,VNTI,VIPI,VMAR,WEST,WABC,VRLL,WIPR,WCKH,VSTI,WLSP,VART,VOLT,ZYDS,ZEE,ZENT,YESB`);
  const dataRaw = await allQuotesProm.json();
  const alldata = dataRaw.data.map(i => getInternalData(i));
  const resolvedData = await Promise.all(alldata);
  return resolvedData;
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
    const indexProm = await fetch('https://etmarketsapis.indiatimes.com/ET_Stats/getAllIndices?exchange=nse');
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
  getRSIForAllTopCompanies,
  getNiftyHundredETData,
  getNiftyETFData,
  getAllQuotes,
  getShortCandidates,
  getIndexData,
  getGlobalIndexData,
  getLiveRSIDaywise,
  getTop200DRSI,
  getForecasts
};
