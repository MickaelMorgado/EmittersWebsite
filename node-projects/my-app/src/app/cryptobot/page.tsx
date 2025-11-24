// // app/sniper/page.tsx
// "use client";

// import { ethers } from "ethers";
// import { useEffect, useState } from "react";

// /*
//   Uniswap V3 core addresses (Ethereum mainnet)
// */
// const FACTORY_V3 = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
// const SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 SwapRouter
// const QUOTER = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";     // Quoter v1/v2

// const WETH_ADDRESS = "0xC02aaa39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH on mainnet

// /* Minimal ABIs */
// const FACTORY_V3_ABI = [
//   "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)"
// ];

// const QUOTER_ABI = [
//   // quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96) returns amountOut
//   "function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)"
// ];

// const SWAP_ROUTER_ABI = [
//   // exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) payable returns (uint256 amountOut)
//   "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256)"
// ];

// export default function SniperPageV3() {
//   const [status, setStatus] = useState("Initializing (V3)...");

//   useEffect(() => {
//     if (!window.ethereum) {
//       setStatus("MetaMask not installed");
//       return;
//     }

//     let factory: ethers.Contract;
//     let provider: ethers.BrowserProvider;
//     let signer: ethers.JsonRpcSigner;

//     async function init() {
//       try {
//         provider = new ethers.BrowserProvider(window.ethereum);
//         await provider.send("eth_requestAccounts", []);
//         signer = await provider.getSigner();

//         factory = new ethers.Contract(FACTORY_V3, FACTORY_V3_ABI, provider);
//         const quoter = new ethers.Contract(QUOTER, QUOTER_ABI, provider);
//         const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);

//         setStatus("Listening for PoolCreated (V3)...");

//         factory.on(
//           "PoolCreated",
//           async (token0: string, token1: string, fee: number, tickSpacing: number, poolAddr: string) => {
//             try {
//               console.log("V3 PoolCreated:", { token0, token1, fee, poolAddr, tickSpacing });

//               // choose token (ETH side)
//               const token = token0.toLowerCase() === WETH_ADDRESS.toLowerCase() ? token1 : token0;

//               // quick contract existence check
//               const code = await provider.getCode(token);
//               if (code === "0x") {
//                 console.log("token has no code -> skip");
//                 return;
//               }

//               // set amount to spend (in wei)
//               const amountIn = ethers.parseEther("0.01"); // adjust

//               // use Quoter to get estimated amountOut for exact input single
//               // sqrtPriceLimitX96 = 0 (no price limit)
//               let amountOut: bigint | null = null;
//               try {
//                 amountOut = await quoter.quoteExactInputSingle(
//                   WETH_ADDRESS,
//                   token,
//                   fee,
//                   amountIn,
//                   0
//                 );
//               } catch (qErr) {
//                 console.log("Quoter failed:", qErr);
//                 return;
//               }

//               console.log("Quoted amountOut:", amountOut?.toString());

//               if (!amountOut || amountOut === 0n) return;

//               // minimal slippage tolerance
//               const slippageBps = 500; // 5% (example)
//               const minOut = (amountOut * BigInt(10000 - slippageBps)) / BigInt(10000);

//               // Prepare params struct for exactInputSingle
//               const params = {
//                 tokenIn: WETH_ADDRESS,
//                 tokenOut: token,
//                 fee: fee,
//                 recipient: await signer.getAddress(),
//                 deadline: Math.floor(Date.now() / 1000) + 60,
//                 amountIn: amountIn,
//                 amountOutMinimum: minOut,
//                 sqrtPriceLimitX96: 0
//               };

//               // Execute swap — send ETH as msg.value because tokenIn is WETH; router wraps ETH for you in some router deployments
//               // NOTE: Some router deployments expect WETH to be wrapped first. In practice you may need to use WETH9 contract or router's exactInputSingleSupportingFeeOnTransferTokens variant.
//               const tx = await router.exactInputSingle(params, { value: amountIn, gasLimit: 700000 });
//               console.log("Swap tx sent:", tx.hash);

//               // optional: wait for receipt
//               // const receipt = await tx.wait();
//               // console.log("Swap receipt:", receipt.transactionHash);
//             } catch (err) {
//               console.error("PoolCreated handler error:", err);
//             }
//           }
//         );
//       } catch (err) {
//         console.error("init error:", err);
//         setStatus("Error connecting to MetaMask / V3");
//       }
//     }

//     init();

//     // cleanup on unmount
//     return () => {
//       try {
//         if (factory) factory.removeAllListeners("PoolCreated");
//       } catch (e) {}
//     };
//   }, []);

//   return (
//     <>
//       <h1>Sniper Bot (Uniswap V3)</h1>
//       <p>Status: {status}</p>
//       <p>Open console to monitor events and tx logs.</p>
//     </>
//   );
// }
