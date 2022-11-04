import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {

    const zero = BigNumber.from(0);
    const [walletConnected, setWalletConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
    const [balanceOfVodkaTokens, setBalanceOfVodkaTokens] = useState(zero);
    const [tokenAmount, setTokenAmount] = useState(zero);
    const [tokensMinted, setTokensMinted] = useState(zero);
    const [isOwner, setIsOwner] = useState(false);
    const web3ModalRef = useRef();

    const getTokensToBeClaimed = async () => {
        try {
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
            const signer = await getProviderOrSigner(true);
            const address = await signer.getAddress();
            const balance = await nftContract.balanceOf(address);

            if (balance === zero) {
                setTokensToBeClaimed(zero);
            } else {
                var amount = 0;
                for (var i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
                    const claimed = await tokenContract.tokenIdsClaimed(tokenId);
                    if (!claimed) {
                        amount++;
                    }
                }
                setTokensToBeClaimed(BigNumber.from(amount));
            }
        } catch (err) {
            console.error(err);
            setTokensToBeClaimed(zero);
        }
    };

    const getBalanceOfVodkaTokens = async () => {
        try {
            const provider = await getProviderOrSigner();
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
            const signer = await getProviderOrSigner(true);
            const address = await signer.getAddress();
            const balance = await tokenContract.balanceOf(address);

            setBalanceOfVodkaTokens(balance);
        } catch (err) {
            console.error(err);
            setBalanceOfVodkaTokens(zero);
        }
    };

    const mintVodkaToken = async (amount) => {
        try {
            const signer = await getProviderOrSigner(true);
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
            const value = 0.001 * amount;
            const tx = await tokenContract.mint(amount, { value: utils.parseEther(value.toString()) });

            setLoading(true);
            await tx.wait();
            setLoading(false);
            window.alert("Sucessfully minted Vodka Tokens");

            await getBalanceOfVodkaTokens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            console.error(err);
        }
    };

    const claimVodkaTokens = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
            const tx = await tokenContract.claim();

            setLoading(true);
            await tx.wait();
            setLoading(false);
            window.alert("Sucessfully claimed Vodka Tokens");

            await getBalanceOfVodkaTokens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            console.error(err);
        }
    };

    const getTotalTokensMinted = async () => {
        try {
            const provider = await getProviderOrSigner();
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
            const _tokensMinted = await tokenContract.totalSupply();

            setTokensMinted(_tokensMinted);
        } catch (err) {
            console.error(err);
        }
    };

    const getOwner = async () => {
        try {
            const provider = await getProviderOrSigner();
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
            const _owner = await tokenContract.owner();
            const signer = await getProviderOrSigner(true);
            const address = await signer.getAddress();

            if (address.toLowerCase() === _owner.toLowerCase()) {
                setIsOwner(true);
            }
        } catch (err) {
            console.error(err.message);
        }
    };

    const withdrawCoins = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
            const tx = await tokenContract.withdraw();

            setLoading(true);
            await tx.wait();
            setLoading(false);
            await getOwner();
        } catch (err) {
            console.error(err);
        }
    };

    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);
        const { chainId } = await web3Provider.getNetwork();

        if (chainId !== 5) {
            window.alert("Change the network to Goerli");
            throw new Error("Change network to Goerli");
        }

        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }

        return web3Provider;
    };

    const connectWallet = async () => {
        try {
            await getProviderOrSigner();
            setWalletConnected(true);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet();
            getTotalTokensMinted();
            getBalanceOfVodkaTokens();
            getTokensToBeClaimed();
            withdrawCoins();
        }
    }, [walletConnected]);

    const renderButton = () => {

        if (loading) {
            return (
                <div>
                    <button className={styles.button}>Cargando...</button>
                </div>
            );
        }

        if (walletConnected && isOwner) {
            return (
                <div>
                    <button className={styles.button1} onClick={withdrawCoins}>
                        Retirar monedas
                    </button>
                </div>
            );
        }

        if (tokensToBeClaimed > 0) {
            return (
                <div>
                    <div className={styles.description}>
                        {tokensToBeClaimed * 10} Tokens que pueden ser reclamados
                    </div>
                    <button className={styles.button} onClick={claimVodkaTokens}>
                        Reclamar Tokens
                    </button>
                </div>
            );
        }

        return (
            <div style={{ display: "flex-col" }}>
                <div>
                    <input
                        type="number"
                        placeholder="Amount of Tokens"
                        // BigNumber.from converts the `e.target.value` to a BigNumber
                        onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
                        className={styles.input}
                    />
                </div>

                <button
                    className={styles.button}
                    disabled={!(tokenAmount > 0)}
                    onClick={() => mintVodkaToken(tokenAmount)}
                >
                    Mintear Tokens
                </button>
            </div>
        );
    };

    return (
        <div>
            <Head>
                <title>Vodka Tokens</title>
                <meta name="description" content="ICO-Dapp" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.main}>
                <div className={styles.content}>
                    <h1 className={styles.title}>Welcome to Vodka ICO!</h1>
                    <div className={styles.description}>
                        ¡Ya puedes reclamar tus tokens Vodka(JAJ)!
                    </div>
                    {walletConnected ? (
                        <div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                Has minteado {utils.formatEther(balanceOfVodkaTokens)} Vodka tokens
                            </div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                ¡¡¡ {utils.formatEther(tokensMinted)}/10000 han sido minteados !!!
                            </div>
                            {renderButton()}
                        </div>
                    ) : (
                        <button onClick={connectWallet} className={styles.button}>
                            Conecta tu wallet
                        </button>
                    )}
                </div>
                <div className={styles.picture}>
                    <img className={styles.image} src="./main.png" />
                </div>
            </div>

            <footer className={styles.footer}>
                Made with ❤️ by Carmona44
            </footer>
        </div>
    );
}