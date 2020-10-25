import { MongoClient } from "mongodb";

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

const GetShortPositions = async () => {
  const client = await Connect();
  const openPositions = await client
    .db("DBDecider")
    .collection("Shorts")
    .find({
      Position: "open",
    })
    .toArray();
  return openPositions;
};

const CoverShortPosition = async (coverShort) => {
  const client = await Connect();
  /*
    const coverShort ={
        Symbol :'INFY',
        SellPrice: 980
    }
    */
  const shortsOfSymbol = await client
    .db("DBDecider")
    .collection("Shorts")
    .find({
      Position: "open",
      Symbol: coverShort.Symbol,
    })
    .toArray();
  let pl = 0;
  let principal = 0;
  //calculate profit or loss
  shortsOfSymbol.forEach((i) => {
    pl += i.Qty * (i.Buy - coverShort.SellPrice);
    principal += i.Qty * i.Buy;
  });
  if (pl > 0) {
    pl = 0.9 * pl;
  }
  const finalAmount = principal + pl;
  //add the Pl to the balance
  await client
    .db("DBDecider")
    .collection("Balance")
    .findOneAndUpdate({ ID: 1 }, { $inc: { Balance: finalAmount } });

  //finally close the positions
  await client
    .db("DBDecider")
    .collection("Shorts")
    .findOneAndUpdate(
      { Symbol: coverShort.Symbol,
        Position:'open' },
      { $set: { Position: "close" } }
    );
};

const DeleteClosedPositions=async ()=>{
    const client = await Connect();
    await client
    .db("DBDecider")
    .collection("Shorts")
    .deleteMany({
        Position :'close'
    })
}

const GetBalance = async () => {
  const client = await Connect();
  const Balance = await client
    .db("DBDecider")
    .collection("Balance")
    .findOne({ ID: 1 });
  return Balance.Balance;
};

const AddShortPosition = async (shortPosition) => {
  const client = await Connect();
  //short Position
  /*
  const shortPosition = {
    Type: "short",
    Symbol: "INFY",
    Buy: 987.5,
    Qty: 1,
    Position:'open'
  };
  */
  //add the position

  const InsertedShort = await client
    .db("DBDecider")
    .collection("Shorts")
    .insertOne(shortPosition);

  const balanceToBeDeducted = shortPosition.Buy * shortPosition.Qty;

  //add balance

  await client
    .db("DBDecider")
    .collection("Balance")
    .findOneAndUpdate({ ID: 1 }, { $inc: { Balance: -balanceToBeDeducted } });

  //finally close the client
  client.close();
  //return InsertedShort;
};

const AllShorting = async (req) => {
  const methodName = req.queryStringParameters.method;
  const data = req.queryStringParameters.data;
  
  let buff = null;
  let text = null;
  let parsedData = null;
  if (data) {
    buff = Buffer.from(data, "base64");
    text = buff.toString("utf-8");
    parsedData = JSON.parse(text);
  }
  
  if (methodName === "GetBalance") {
    const result = await GetBalance();
    return result;
  } else if (methodName === "GetShortPositions") {
    const result = await GetShortPositions();
    return result;
  } else if (methodName === "AddShortPosition") {
    const result = await AddShortPosition(parsedData);
    return result;
  } else if (methodName === "CoverShortPosition") {
    const result = await CoverShortPosition(parsedData);
    return result;
  }else if (methodName === "DeleteClosedPositions") {
    const result = await DeleteClosedPositions();
    return result;
  }
};
/*
const shortPosition = {
    Type: "short",
    Symbol: "TCS",
    Buy: 1879,
    Qty: 2,
    Position:'open'
  };
  const encoded=Buffer.from(JSON.stringify(shortPosition)).toString('base64');
  
  const decoded =JSON.parse((Buffer.from(encoded, 'base64')).toString());
  console.log(decoded);

/*
AllShorting('GetShortPositions').then(d=>{
    console.log(d);    
});
*/

module.exports = {
  AllShorting,
};
