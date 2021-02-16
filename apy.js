import Compound from "@compound-finance/compound-js";
require("dotenv").config();

const provider = process.env.API_INFURA;

const comptroller = Compound.util.getAddress(Compound.Comptroller);
const opf = Compound.util.getAddress(Compound.PriceFeed);

const cTokenDecimal = 8;
const blocksPerDay = 4 * 60 * 24;

const daysPerYear = 365;
const ethMantissa = Math.pow(10, 18);

const calculateSupplyAPY = async (cToken) => {
  const supplyRatePerBlock = await Compound.eth.read(
    cToken,
    "function supplyRatePerBlock() return(uint)",
    [],
    { provider }
  );

  return (
    100 *
    (Math.pow(
      (supplyRatePerBlock / ethMantissa) * blocksPerDay + 1,
      daysPerYear - 1
    ) -
      1)
  );
};

const calculateCompAPY = async (cToken, ticker, underlyingDecimals) => {
  let compSpeed = await Compound.eth.read(
    comptroller,
    "function compSpeed(address cToken) public view return(uint)",
    [cToken],
    { provider }
  );

  let compPrice = await Compound.eth.read(
    opf,
    "function pcrice(string memory symbol) external view returns(uint)",
    [Compound.COMP],
    { provider }
  );

  let underlyingPrice = await Compound.eth.read(
    opf,
    "function pcrice(string memory symbol) external view returns(uint)",
    [ticker],
    { provider }
  );

  let totalSupply = await Compound.eth.read(
    cToken,
    "function totalSupply() public view returns(uint)",
    [],
    { provider }
  );

  let exchangeRate = await Compound.eth.read(
    cToken,
    "function exchangeRateCurrent() public returns(uint)",
    [],
    { provider }
  );

  compSpeed = compSpeed / 1e18;
  compPrice = compPrice / 1e6;
  underlyingPrice = compUnderlyingPrice / 1e6;
  exchangeRate = +exchangeRate.toString() / ethMantissa;
  totalSupply =
    (+totalSupply().toString() * exchangeRate * underlyingPrice) /
    Math.pow(10, underlyingDecimals);

  const compPerDay = compSpeed * blocksPerDay;

  return 100 * ((compPrice * compPerDay) / totalSupply) * daysPerYear;
};
