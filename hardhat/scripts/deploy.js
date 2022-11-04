const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { BUENACHICA_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {

    const buenaChicaNFTContract = BUENACHICA_NFT_CONTRACT_ADDRESS;

    const vodkaTokenContract = await ethers.getContractFactory("VodkaToken");

    const deployedVodkaTokenContract = await vodkaTokenContract.deploy(buenaChicaNFTContract);

    await deployedVodkaTokenContract.deployed();

    console.log("Vodka Token Contract Address:", deployedVodkaTokenContract.address);
    //0x20352538d4f35e0E458Af0178C054aBE3DDeAe61

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });