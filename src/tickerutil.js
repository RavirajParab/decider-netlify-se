import fetch from 'node-fetch';
const { MongoClient } = require("mongodb");
const { RSI } = require("technicalindicators");
const { MACD } = require("technicalindicators");

async function Connect() {
  //username for mongo login : ravirajparab44@gmail.com
  const constring =
    "mongodb+srv://learner:learner@mycluster-2wsgs.azure.mongodb.net";
  const client = await MongoClient.connect(constring, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return client;
}

const AddTickerData = async (data) => {
    const client = await Connect();
    const tickerAdd = await client
      .db("DBDecider")
      .collection("Ticker")
      .insertOne({
          type: 'ticker',
          info: data
      })
    return tickerAdd;
  };

  const GetTicker = async () => {
    const client = await Connect();
    const tickerData = await client
      .db("DBDecider")
      .collection("Ticker")
      .findOne({ type: 'ticker' });
    return tickerData;
  };

const UpdateTicker =async (newTickerData)=>{
    const client = await Connect();
    const tickerUpdate = await client
    .db("DBDecider")
    .collection("Ticker")
    .findOneAndUpdate({ type: 'ticker' }, { $set: { info: newTickerData } });
    return tickerUpdate;
}
 
const fixToDecimal=(data)=>{
    if(data){
        return Number(data.toFixed(2));
    }
    else{
        return 0;
    }
}

const calculateRSI=(i,lq)=>{
    const prevClosings= i.historical.map(i=>i.lp);
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


const calculateMACD=(i,lq)=>{
    const prevClosings= i.historical.map(i=>i.lp);
    prevClosings.push(lq.price);
    const itemsToBeRemoved = prevClosings.length - 18;
    prevClosings.splice(0, itemsToBeRemoved);
    const inputMACD = {
        values: prevClosings,
        fastPeriod        : 5,
        slowPeriod        : 8,
        signalPeriod      : 3 ,
        SimpleMAOscillator: false,
        SimpleMASignal    : false
      };
    const MACDcal =MACD.calculate(inputMACD);
    const finalMACD = MACDcal[MACDcal.length-1];
    return finalMACD;
}

const getChange=(i,lq)=>{
    const currPrice = lq.price;
    const yestPrice = i.historical[i.historical.length-1].lp;
    const change = currPrice/yestPrice;
    return fixToDecimal(change);
}

const getInternalData =async (sec)=>{
    try{
        const urlData = await fetch(`https://api.tickertape.in/stockwidget/internal/${sec.sid}`);
        const rawData = await urlData.json();
        const data = rawData.data; 
        const secData= {
            name :data.info.name,
            ticker :data.info.ticker,
            sector :data.info.gic.sector,
            yearHigh:data.ratios['52wHigh'],
            yearLow:data.ratios['52wLow'],
            pe: fixToDecimal(data.ratios.pe),
            beta : fixToDecimal(data.ratios.beta),
            mcap:data.ratios.marketCap,
            monthReturns:fixToDecimal(data.ratios.returns['1m']),
            yearReturns:fixToDecimal(data.ratios.returns['1y']),
            historical :data.historical,
            quote : sec
        }
        return secData;
    }catch(err){
        console.log(`Failed for `,sec.sid);
    }
}

const getAllQuotes =async()=>{
    const allQuotesProm =await  fetch(`https://quotes-api.tickertape.in/quotes?sids=ADIA,AFFL,ADRG,ARTI,ACC,ADNA,ADAI,ADEN,ADTB,APSE,ABB,AEGS,ADEL,TMIN,ABOT,AIAE,ADAG,AVAS,AMAR,AJPH,ALKY,APLO,AMBE,ABUJ,ALKE,ALMC,ACLL,ALEM,APLH,AKZO,ALOK,APLA,ABDL,ASTR,ASPT,ATRD,ATLP,AXBK,ARBN,ASPN,AUFI,AVNT,ASOK,BARA,BFRG,BACO,BJFS,BRGR,BATA,BAJA,BLKI,BLMR,BACH,BANH,BEML,BOI,BOB,BBRM,BJFN,BAYE,BJEL,BJAT,BASF,BAJE,BDYN,BRIG,BLIS,BIRS,BLDT,BRIT,BION,BRLC,CNFH,BHEL,BOSH,BRTI,BLUS,BSEL,BRSN,CNBK,BPCL,CADI,CNTP,CENA,CAPG,CHAL,CRBR,CEAT,CESC,CREI,CIPL,CAPL,CCLP,COAL,CNTY,CORF,CAST,CHPC,COFO,COLG,CCRI,CHOL,COCH,CBI,CHMB,CHLA,CERA,DABU,CYIE,DALB,DPNT,CUMM,DELT,CSBB,DIBL,DSHM,DHNP,CRSL,CROP,DBCL,DCMS,CRDE,CTBK,DCBA,AVEU,DLF,ELGE,DSTV,DIXO,ECLE,EIHO,EIDP,EDEL,REDY,EMAM,DIVI,EICH,GUJL,ENGI,FNXC,FTRE,FINX,ESAB,ESCO,FRTL,GAME,GAIL,ERIS,FOHE,FISO,FED,FINO,EQHL,ENDU,FDC,ESSL,EXID,GMMP,GEPO,GRWL,GHCH,GDFR,GALX,GODE,GILE,GLEN,GNFC,GENA,GESC,GMDC,GOCP,GMRI,GLAX,GODI,GODR,HIAE,GRAN,GRNN,GRSE,HAPL,GSPT,GGAS,HVEL,GALK,GOLU,GRAS,GSFC,HAWY,GPPL,GRPH,GRVL,HALC,HUDC,HPCL,HDFC,HZNC,HDBK,INRL,HDFL,HCPR,HIMD,INBF,HCLT,HEFI,HLL,HEGL,HFCL,HROM,HDFA,HEID,HONE,ICBK,VODA,IDBI,IDFB,IFBI,IGAS,ICMN,INBA,INDB,ICIL,IDFC,INGL,INRM,ICIR,IIFL,IHTL,IIFW,IIAN,ICRA,INMR,IFIB,IRCN,IOLC,ITEL,JKBK,INIR,ICCI,ITC,BHRI,IOBK,INGR,JAGP,INFY,JAIC,INBK,IRBI,JMNA,INOL,IOC,IPCA,JIST,JUBI,KANE,JIND,JKCE,JSTL,JUST,JCHA,JSWE,JYOI,JINA,JBCH,JKLC,JTEK,KAPT,JMSH,KAJR,JKIN,JNSP,JKPA,KEIN,KTKM,KARU,KECL,KNRL,KOLT,KRBL,LAOP,LART,DLPA,LUXI,MMFS,LRTI,LAUL,LKMC,KSBL,LIND,KVRI,LICH,MAHM,KBNK,LEMO,LTEH,LTFH,LUPN,MCEI,MRCO,MHSC,MHSM,BMBK,MALO,MNFL,UNSP,MRTI,MASF,METP,MOIL,MMTC,MOSS,MRPL,MINT,MAXI,MAHH,MINC,MOFS,MBFL,MISR,MRF,MNDA,MGAS,NHPC,NAVN,NBCC,NARY,NAFL,NALU,NATP,NAFT,MUTT,NIPF,NCCL,NEST,INED,NSEN,THEE,NOCI,OILI,ORCL,ORCE,NMDC,ONGC,NLCI,OEBO,ORRE,NKML,NTPC,ONTE,OMAX,PAGE,PWFC,PIRA,PROC,PHOE,PIDI,PLNG,PERS,HUHT,PNBK,PROR,PHIL,PIIL,PFIZ,PNBH,PREG,PGRD,PNCI,ABBW,PSPP,PRAJ,PLYP,POLC,PVRL,QUEC,PRIS,PLMD,PTCI,RADC,RATB,RYMD,RELI,RITS,REXP,RSTC,RLXO,RALL,REDI,RECM,RAID,TRCE,RMT,SAIL,SBIC,RAIV,SANO,SBI,SCHE,SHOP,SEIN,SHEF,SHME,SHCM,SBIL,SEQU,SCI,SHCU,SLIN,SPRC,SIEM,SIBK,SECR,SKFB,SOBH,SOLA,SJVN,SOFT,STAT,SRTR,SDCH,SNFN,SUNT,SUN,SUPE,SPJT,SUMH,SUTV,SRFL,SNFS,SRID,STTE,SUPI,SPTL,TTPW,TTEX,TISC,SUVH,TABE,SYMP,TTCH,SUZL,TATA,TAMdv,TATS,TCNS,TCIE,STEN,SWAR,TACO,SYNN,TACN,TAMO,SWAN,TCS,TINV,TLSV,TEML,TITN,TOPO,TRIE,THYO,TVEB,THMX,TVTO,UCBK,TTKL,TORP,TVSM,UBBW,TREN,TBEI,TIMK,UJVF,UJJI,UPLL,VARB,ULTC,VGUA,UNBK,VENK,VAKR,UFLX,VAIB,VARE,WHIR,WGSR,VNTI,VIPI,VMAR,WEST,WABC,VRLL,WIPR,WCKH,VSTI,WLSP,VART,VOLT,ZYDS,ZEE,ZENT,YESB`);
    const dataRaw =await allQuotesProm.json();
    const alldata =dataRaw.data.map(i=>getInternalData(i));
    const resolvedData = await Promise.all(alldata);
    return resolvedData;
}

const reProcessMongoTickerData =async ()=>{
   const tickerData= await GetTicker();
   const processedMongoTickerData= tickerData.info.map(i=>{
       if(i.quote){
       let val = {...i};
       delete val.historical;
       delete val.quote;
       const RSI = calculateRSI(i,i.quote);
       const MACDDetails =(calculateMACD(i,i.quote));
       const MACD = fixToDecimal(MACDDetails.MACD);
       const MACDSignal = fixToDecimal(MACDDetails.signal);
       return {...val,...i.quote, RSI, MACD,MACDSignal}
    }
   });
   return processedMongoTickerData;
}

const SetupTicker =async ()=>{
    try{
        const quotes = await getAllQuotes();
        console.log('Ticker quotes obtained. Now updating MongoDB....');
        const tickerData =await UpdateTicker(quotes);
        console.log('Now, processing the MongoTicker data');
        const reProcessedData=await reProcessMongoTickerData();
        console.log('re-processing successfull');
        console.log('updating MongoDB with processed data');
        await UpdateTicker(reProcessedData);
        return {'Message':'MongoDB Updated successfully with ticker data'};
    }
    catch(err){
        console.log(err);
    }
}

module.exports={
    SetupTicker
}