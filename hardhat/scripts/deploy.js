const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { BUENACHICA_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {

    const buenaChicaNFTContract = BUENACHICA_NFT_CONTRACT_ADDRESS;

    const vodkaTokenContract = await ethers.getContractFactory("VodkaToken");

    const deployedVodkaTokenContract = await vodkaTokenContract.deploy(buenaChicaNFTContract);

    await deployedVodkaTokenContract.deployed();

    console.log("Vodka Token Contract Address:", deployedVodkaTokenContract.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });