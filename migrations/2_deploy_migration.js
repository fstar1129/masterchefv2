const { BigNumber } = require("@ethersproject/bignumber");
const MasterChef = artifacts.require("MasterChef");
const HokkFiToken = artifacts.require("HokkFiToken");
const Staking = artifacts.require('Staking');
// const MultiCall = artifacts.require("MultiCall");
// const Timelock = artifacts.require("Timelock");

const INITIAL_MINT = '1000000000';
/** eth block per hour */
const BLOCKS_PER_HOUR = 276 // sec Block Time (3600 / 13) 13sec/per block
/** bsc block per hour */
// const BLOCKS_PER_HOUR = 1200 // sec Block Time (3600 / 13) 13sec/per block
const TOKENS_PER_BLOCK = '30';
const BLOCKS_PER_DAY = 24 * BLOCKS_PER_HOUR
const TIMELOCK_DELAY_SECS = (3600 * 24);
const FARM_FEE_ACCOUNT = '0x674aC2fA134B37E38f964053Ca5D510819de3E3c'

const name = "Treats"
const symbol= "TREATS"
const cap = '100000000000000000000000000000'
const manualMintLimit = "100000000000000000000000000000"
const lockblock   = 11360527
const unlockblock = lockblock + BLOCKS_PER_DAY * 180

const devaddress = '0x674aC2fA134B37E38f964053Ca5D510819de3E3c'
const liquidityaddress = '0x674aC2fA134B37E38f964053Ca5D510819de3E3c'
const comfundaddress = '0x674aC2fA134B37E38f964053Ca5D510819de3E3c'
const founderaddress = '0x674aC2fA134B37E38f964053Ca5D510819de3E3c'
const rewardperblock = '30';
const STARTING_BLOCK = 10868706;
const REWARDS_START = String(STARTING_BLOCK + (BLOCKS_PER_HOUR * 6))
const HALFING_AFTER_BLOCK = String(REWARDS_START * 365)
const userdepFee = 75
const devdepfee = 9925
const rewardmultipler = [10, 5, 1]
const blockDeltaStartStage = [0, 1, 10000, 20000, 300000]
const blockDeltaEndStage = [9999, 19999, 29999]
const userFeeStage= [75, 92, 96, 98, 99]
const devFeeStage = [25, 8, 4, 2, 1]

const ROPSTEN_WETH = '0xc778417e063141139fce010982780140aa0cd5ab'
const ROPSTEN_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
const OWNER_ADDRESS = '0x674aC2fA134B37E38f964053Ca5D510819de3E3c'

const logTx = (tx) => {
    console.dir(tx, {depth: 3});
}

// let block = await web3.eth.getBlock("latest")
module.exports = async function(deployer, network, accounts) {
    console.log({network});

    let currentAccount = accounts[0];
    let feeAccount = FARM_FEE_ACCOUNT;
    if (network == 'testnet') {
        console.log(`WARNING: Updating current account for testnet`)
    }

    if (network == 'development' || network == 'testnet') {
        console.log(`WARNING: Updating feeAcount for testnet/development`)
    }

    let HokkFiInstance;
    let StakingInstance;
    let HokkFiMasterChef;

    /**
     * Deploy HokkFiToken
     */
    deployer.deploy(HokkFiToken, 
        name,
        symbol,
        cap,
        manualMintLimit,
        lockblock,
        unlockblock
        ).then((instance) => {
        HokkFiInstance = instance;
        /**
         * Mint intial tokens for liquidity pool
         */
        return HokkFiInstance.mint("0x674aC2fA134B37E38f964053Ca5D510819de3E3c", BigNumber.from(INITIAL_MINT).mul(BigNumber.from(String(10**18))));
    }).then((tx)=> {
        /**
         * Deploy Staking
         */
        return deployer.deploy(Staking)
    }).then((instance)=> {
        StakingInstance = instance;
        /**
         * Deploy MasterChef
         */
        console.log(`Deploying MasterChef with DEV/TEST settings`)
        return deployer.deploy(MasterChef, 
            HokkFiToken.address, 
            devaddress,
            liquidityaddress,
            comfundaddress,
            founderaddress,
            BigNumber.from(TOKENS_PER_BLOCK).mul(BigNumber.from(String(10**18))), 
            STARTING_BLOCK,
            HALFING_AFTER_BLOCK, 
            userdepFee,
            devdepfee,
            rewardmultipler,
            blockDeltaStartStage,
            blockDeltaEndStage,
            userFeeStage,
            devFeeStage
        )
    }).then(async (instance)=> {
        HokkFiMasterChef = instance;
        await HokkFiMasterChef.lockUpdate(80);
        await HokkFiMasterChef.lockcomUpdate(6)
        await HokkFiMasterChef.lockdevUpdate(6)
        await HokkFiMasterChef.lockfounderUpdate(4)
        await HokkFiMasterChef.locklpUpdate(4)
        await HokkFiMasterChef.addAuthorized(OWNER_ADDRESS)
        await HokkFiMasterChef.setStakingContract(Staking.address)
        /**
         * TransferOwnership of BANANA to MasterChef
         */
        await HokkFiInstance.transferOwnership(MasterChef.address);
        return StakingInstance.transferOwnership(MasterChef.address);
    }).then((tx)=> {
         console.log('Rewards Start at block: ', REWARDS_START)
         console.table({
             MasterChef:MasterChef.address,
             HokkFiToken:HokkFiToken.address,
             Staking:Staking.address,
        })
    });
};
