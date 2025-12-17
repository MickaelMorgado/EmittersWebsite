// app/cryptobot/page.tsx
"use client";

import { ethers } from "ethers";
import { useEffect, useState } from "react";

// Declare MetaMask ethereum provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

/*
  DEX Factory addresses (Ethereum mainnet)
*/
const FACTORY_V3 = "0x1F98431c8aD98523631AE4a59f267346ea31F984";     // Uniswap V3
const FACTORY_V2 = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";     // Uniswap V2
const SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";     // Uniswap V3 SwapRouter
const QUOTER = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";         // Quoter v1/v2
const WETH_ADDRESS = "0xC02aaa39b223FE8D0A0e5C4F27eAD9083C756Cc2";     // WETH on mainnet

/* Minimal ABIs */
const FACTORY_V3_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)"
];

const FACTORY_V2_ABI = [
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

const QUOTER_ABI = [
  "function quoteExactInputSingle(address,address,uint24,uint256,uint160) external returns (uint256)"
];

const SWAP_ROUTER_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256)"
];

const WETH_ABI = [
  "function deposit() payable",
  "function withdraw(uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)"
];

interface Trade {
  token: string;
  amountIn: string;
  amountOut: string;
  txHash: string;
  timestamp: number;
  success: boolean;
  type: 'buy' | 'sell';
  pnl?: number; // Profit/Loss percentage
}

interface Position {
  token: string;
  tokenAddress: string;
  amountBought: string;
  ethSpent: string;
  buyPrice: string; // ETH per token
  currentPrice: string;
  pnl: number; // Current P&L percentage
  buyTxHash: string;
  buyTimestamp: number;
  dex: 'v2' | 'v3';
}

interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  poolAddress: string;
  timestamp: number;
  sniped: boolean;
  dex: 'v2' | 'v3';
  isValid?: boolean;
  validationChecked?: boolean;
}

export default function CryptoBotPage() {
  const [status, setStatus] = useState("Initializing...");
  const [isActive, setIsActive] = useState(false);
  const [amountInEth, setAmountInEth] = useState("0.01");
  const [slippagePercent, setSlippagePercent] = useState("5");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [ethBalance, setEthBalance] = useState("0");
  const [initialEthBalance, setInitialEthBalance] = useState("0");
  const [poolMonitoringInterval, setPoolMonitoringInterval] = useState<NodeJS.Timeout | null>(null);
  const [positionMonitoringInterval, setPositionMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!window.ethereum) {
      setStatus("MetaMask not installed");
      return;
    }

    let provider: ethers.BrowserProvider;
    let signer: ethers.JsonRpcSigner;
    let weth: ethers.Contract;

    async function init() {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();

        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        const balanceStr = ethers.formatEther(balance);
        setEthBalance(balanceStr);
        setInitialEthBalance(balanceStr); // Store initial balance for P&L calculation

        const factoryV3 = new ethers.Contract(FACTORY_V3, FACTORY_V3_ABI, provider);
        const factoryV2 = new ethers.Contract(FACTORY_V2, FACTORY_V2_ABI, provider);
        const quoter = new ethers.Contract(QUOTER, QUOTER_ABI, provider);
        const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, signer);
        weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);

        setStatus("Ready - Click Start to begin sniping");

        // Store contracts for later use
        (window as any).contracts = { factoryV3, factoryV2, quoter, router, weth, provider, signer };

        // Start monitoring pools immediately after contracts are ready
        setTimeout(() => startPoolMonitoring(), 100);

      } catch (err) {
        console.error("init error:", err);
        setStatus("Error connecting to MetaMask");
      }
    }

    init();

    return () => {
      try {
        if (poolMonitoringInterval) clearInterval(poolMonitoringInterval);
        if (positionMonitoringInterval) clearInterval(positionMonitoringInterval);
      } catch (e) {}
    };
  }, []);

  // Polling-based pool monitoring (more reliable than event listeners)
  const startPoolMonitoring = () => {
    console.log("🔄 Starting pool monitoring with polling...");
    const contracts = (window as any).contracts;

    if (!contracts) {
      console.log("❌ Contracts not found in window");
      setStatus("Error: Contracts not initialized");
      return;
    }

    if (!contracts.factoryV3 || !contracts.factoryV2 || !contracts.provider) {
      console.log("❌ Factories or provider not found");
      setStatus("Error: Factories/provider missing");
      return;
    }

    console.log("✅ Starting pool monitoring...");
    setStatus("Monitoring pools...");

    let lastCheckedBlock = 0;

    const checkForNewPools = async () => {
      try {
        console.log("🔍 Checking for new pools...");

        // Get current block number
        const currentBlock = await contracts.provider.getBlockNumber();
        console.log(`📊 Current block: ${currentBlock}, Last checked: ${lastCheckedBlock}`);

        if (lastCheckedBlock === 0) {
          // First run - just set the starting point
          lastCheckedBlock = currentBlock - 10; // Look back 10 blocks
          console.log(`🎯 Set starting block to: ${lastCheckedBlock}`);
          return;
        }

        // Check recent blocks for PoolCreated events
        const fromBlock = lastCheckedBlock + 1;
        const toBlock = Math.min(currentBlock, fromBlock + 99); // Scan up to 100 blocks at a time

        // Only scan if we have blocks to check
        if (fromBlock > toBlock) {
          console.log(`⏳ No new blocks to scan (from: ${fromBlock}, to: ${toBlock})`);
          return;
        }

        console.log(`🔎 Scanning blocks ${fromBlock} to ${toBlock}...`);

        // Check both V2 and V3 factories
        const [v3Events, v2Events] = await Promise.all([
          contracts.factoryV3.queryFilter(contracts.factoryV3.filters.PoolCreated(), fromBlock, toBlock),
          contracts.factoryV2.queryFilter(contracts.factoryV2.filters.PairCreated(), fromBlock, toBlock)
        ]);

        console.log(`📋 Found ${v3Events.length} V3 pools and ${v2Events.length} V2 pairs`);

        // Process V3 pools
        for (const event of v3Events) {
          if (event.args) {
            const [token0, token1, fee, tickSpacing, poolAddr] = event.args;
            console.log("🎯 V3 POOL DETECTED:", { token0, token1, fee: fee.toString(), poolAddr });

            const newPool: PoolInfo = {
              token0,
              token1,
              fee: Number(fee),
              poolAddress: poolAddr,
              timestamp: Date.now(),
              sniped: false,
              dex: 'v3'
            };

            setPools(prev => {
              const exists = prev.some(p => p.poolAddress === poolAddr);
              if (exists) return prev;

              const newPools = [newPool, ...prev.slice(0, 49)];
              console.log("✅ V3 Pool added to list. Total pools:", newPools.length);
              return newPools;
            });

            // Execute trade if sniping is active
            if (isActive) {
              // Start validation asynchronously (don't block pool detection)
              validatePoolAsync(newPool);
            }
          }
        }

        // Process V2 pairs
        for (const event of v2Events) {
          if (event.args) {
            const [token0, token1, pairAddr] = event.args;
            console.log("🎯 V2 PAIR DETECTED:", { token0, token1, pairAddr });

            const newPool: PoolInfo = {
              token0,
              token1,
              fee: 3000, // V2 has fixed 0.3% fee
              poolAddress: pairAddr,
              timestamp: Date.now(),
              sniped: false,
              dex: 'v2'
            };

            setPools(prev => {
              const exists = prev.some(p => p.poolAddress === pairAddr);
              if (exists) return prev;

              const newPools = [newPool, ...prev.slice(0, 49)];
              console.log("✅ V2 Pair added to list. Total pools:", newPools.length);
              return newPools;
            });

            // Execute trade if sniping is active
            if (isActive) {
              // Ultra-simple validation - just try one quote
              console.log(`🚀 Starting ultra-simple validation for pool ${newPool.poolAddress}`);

              // Immediate UI feedback
              setPools(prev => prev.map(p =>
                p.poolAddress === newPool.poolAddress
                  ? { ...p, validationChecked: false }
                  : p
              ));

              // Run ultra-simple validation
              ultraSimpleValidate(newPool);
            }
          }
        }

        lastCheckedBlock = currentBlock;

      } catch (error) {
        console.error("❌ Error checking for pools:", error);
      }
    };

    // Start polling every 5 seconds
    const interval = setInterval(checkForNewPools, 5000);
    setPoolMonitoringInterval(interval);

    // Initial check
    checkForNewPools();

    console.log("✅ Pool monitoring started with 5-second polling");
  };

  const startSniping = () => {
    setIsActive(true);
    setStatus("Sniping active - monitoring pools...");
    console.log("🎯 Sniping mode activated!");
  };

  const executeSnipe = async (pool: PoolInfo) => {
    const contracts = (window as any).contracts;

    // Mark pool as sniped
    setPools(prev => prev.map(p =>
      p.poolAddress === pool.poolAddress ? { ...p, sniped: true } : p
    ));

    let token = "unknown";

    try {
      console.log(`🎯 Executing snipe on ${pool.dex.toUpperCase()} pool:`, pool.poolAddress);

      // Choose the non-WETH token
      token = pool.token0.toLowerCase() === WETH_ADDRESS.toLowerCase() ? pool.token1 : pool.token0;
      if (token.toLowerCase() === WETH_ADDRESS.toLowerCase()) return; // Skip WETH pairs

      // Quick checks
      const code = await contracts.provider.getCode(token);
      if (code === "0x") {
        console.log("Token has no code - skipping");
        return;
      }

      const amountIn = ethers.parseEther(amountInEth);

      // Get quote
      let amountOut: bigint;
      try {
        amountOut = await contracts.quoter.quoteExactInputSingle(
          WETH_ADDRESS,
          token,
          pool.fee,
          amountIn,
          0
        );
      } catch (qErr) {
        console.log("Quote failed - pool might be empty or invalid");
        return;
      }

      if (amountOut <= BigInt("0")) return;

      // Calculate minimum output with slippage
      const slippage = parseFloat(slippagePercent) / 100;
      const minOut = (amountOut * BigInt(Math.floor((1 - slippage) * 10000))) / BigInt(10000);

      console.log(`Sniping ${ethers.formatEther(amountIn)} ETH for ${ethers.formatEther(amountOut)} tokens`);

      // First wrap ETH to WETH
      try {
        const wrapTx = await contracts.weth.deposit({ value: amountIn });
        await wrapTx.wait();
        console.log("ETH wrapped to WETH");
      } catch (wrapErr) {
        console.error("WETH wrap failed:", wrapErr);
        return;
      }

      // Approve WETH for router
      try {
        const approveTx = await contracts.weth.approve(SWAP_ROUTER, amountIn);
        await approveTx.wait();
        console.log("WETH approved");
      } catch (approveErr) {
        console.error("WETH approval failed:", approveErr);
        return;
      }

      // Execute swap
      const params = {
        tokenIn: WETH_ADDRESS,
        tokenOut: token,
        fee: pool.fee,
        recipient: await contracts.signer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        amountIn: amountIn,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0
      };

      const swapTx = await contracts.router.exactInputSingle(params);
      console.log("Swap transaction sent:", swapTx.hash);

      // Wait for confirmation
      const receipt = await swapTx.wait();
      console.log("Swap confirmed:", receipt.transactionHash);

      // Calculate buy price (ETH per token)
      const buyPrice = parseFloat(ethers.formatEther(amountIn)) / parseFloat(ethers.formatEther(amountOut));

      // Record the trade
      const newTrade: Trade = {
        token,
        amountIn: ethers.formatEther(amountIn),
        amountOut: ethers.formatEther(amountOut),
        txHash: swapTx.hash,
        timestamp: Date.now(),
        success: receipt.status === 1,
        type: 'buy'
      };

      setTrades(prev => [newTrade, ...prev.slice(0, 9)]); // Keep last 10 trades

      // Add position for tracking
      const newPosition: Position = {
        token,
        tokenAddress: token,
        amountBought: ethers.formatEther(amountOut),
        ethSpent: ethers.formatEther(amountIn),
        buyPrice: buyPrice.toString(),
        currentPrice: buyPrice.toString(),
        pnl: 0,
        buyTxHash: swapTx.hash,
        buyTimestamp: Date.now(),
        dex: pool.dex
      };

      setPositions(prev => [...prev, newPosition]);

      // Start position monitoring if not already running
      if (!positionMonitoringInterval) {
        startPositionMonitoring();
      }

      // Update balance
      const address = await contracts.signer.getAddress();
      const newBalance = await contracts.provider.getBalance(address);
      setEthBalance(ethers.formatEther(newBalance));

      console.log(`📊 Position added: ${token} - Bought ${ethers.formatEther(amountOut)} tokens for ${ethers.formatEther(amountIn)} ETH`);

    } catch (err) {
      console.error("Snipe error:", err);
      const failedTrade: Trade = {
        token: token || "unknown",
        amountIn: amountInEth,
        amountOut: "0",
        txHash: "",
        timestamp: Date.now(),
        success: false,
        type: 'buy'
      };
      setTrades(prev => [failedTrade, ...prev.slice(0, 9)]);
    }
  };

  const startPositionMonitoring = () => {
    console.log("📊 Starting position monitoring for stop-loss/take-profit...");

    const monitorPositions = async () => {
      if (positions.length === 0) return;

      const contracts = (window as any).contracts;
      if (!contracts) return;

      for (const position of positions) {
        try {
          // Get current price quote (reverse of buy: token -> WETH)
          const tokenAmount = ethers.parseEther("1"); // Quote for 1 token
          let currentQuote: bigint;

          try {
            currentQuote = await contracts.quoter.quoteExactInputSingle(
              position.tokenAddress,
              WETH_ADDRESS,
              position.dex === 'v3' ? 3000 : 3000, // Use 0.3% fee for quoting
              tokenAmount,
              0
            );
          } catch (quoteErr) {
            console.log(`⚠️ Could not get quote for ${position.token}`);
            continue;
          }

          const currentPrice = parseFloat(ethers.formatEther(currentQuote));
          const buyPrice = parseFloat(position.buyPrice);
          const pnl = ((currentPrice - buyPrice) / buyPrice) * 100;

          // Update position with current price and P&L
          setPositions(prev => prev.map(p =>
            p.tokenAddress === position.tokenAddress
              ? { ...p, currentPrice: currentPrice.toString(), pnl }
              : p
          ));

          // Check stop-loss (-1%) and take-profit (+6%)
          if (pnl <= -1) {
            console.log(`🚨 STOP-LOSS triggered for ${position.token}: ${pnl.toFixed(2)}%`);
            await executeSell(position, 'stop-loss');
          } else if (pnl >= 6) {
            console.log(`💰 TAKE-PROFIT triggered for ${position.token}: ${pnl.toFixed(2)}%`);
            await executeSell(position, 'take-profit');
          }

        } catch (error) {
          console.error(`❌ Error monitoring position ${position.token}:`, error);
        }
      }
    };

    // Monitor positions every 30 seconds
    const interval = setInterval(monitorPositions, 30000);
    setPositionMonitoringInterval(interval);

    console.log("✅ Position monitoring started (30-second intervals)");
  };

  const executeSell = async (position: Position, reason: 'stop-loss' | 'take-profit') => {
    const contracts = (window as any).contracts;

    try {
      console.log(`🔄 Executing ${reason} sell for ${position.token}`);

      const tokenAmount = ethers.parseEther(position.amountBought);

      // Get quote for selling tokens to WETH
      let sellQuote: bigint;
      try {
        sellQuote = await contracts.quoter.quoteExactInputSingle(
          position.tokenAddress,
          WETH_ADDRESS,
          position.dex === 'v3' ? 3000 : 3000,
          tokenAmount,
          0
        );
      } catch (quoteErr) {
        console.error(`❌ Could not get sell quote for ${position.token}`);
        return;
      }

      // Calculate minimum output with slippage
      const slippage = parseFloat(slippagePercent) / 100;
      const minOut = (sellQuote * BigInt(Math.floor((1 - slippage) * 10000))) / BigInt(10000);

      // Approve token for router
      const tokenContract = new ethers.Contract(position.tokenAddress, [
        "function approve(address,uint256) returns (bool)"
      ], contracts.signer);

      try {
        const approveTx = await tokenContract.approve(SWAP_ROUTER, tokenAmount);
        await approveTx.wait();
        console.log(`✅ ${position.token} approved for selling`);
      } catch (approveErr) {
        console.error("❌ Token approval failed:", approveErr);
        return;
      }

      // Execute sell swap (token -> WETH)
      const params = {
        tokenIn: position.tokenAddress,
        tokenOut: WETH_ADDRESS,
        fee: position.dex === 'v3' ? 3000 : 3000,
        recipient: await contracts.signer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 300,
        amountIn: tokenAmount,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0
      };

      const sellTx = await contracts.router.exactInputSingle(params);
      console.log(`💸 Sell transaction sent: ${sellTx.hash}`);

      const receipt = await sellTx.wait();
      console.log(`✅ Sell confirmed: ${receipt.transactionHash}`);

      // Calculate final P&L
      const finalPnl = ((parseFloat(ethers.formatEther(sellQuote)) - parseFloat(position.ethSpent)) / parseFloat(position.ethSpent)) * 100;

      // Record the sell trade
      const sellTrade: Trade = {
        token: position.token,
        amountIn: position.amountBought,
        amountOut: ethers.formatEther(sellQuote),
        txHash: sellTx.hash,
        timestamp: Date.now(),
        success: receipt.status === 1,
        type: 'sell',
        pnl: finalPnl
      };

      setTrades(prev => [sellTrade, ...prev.slice(0, 9)]);

      // Remove position from tracking
      setPositions(prev => prev.filter(p => p.tokenAddress !== position.tokenAddress));

      // Update ETH balance
      const address = await contracts.signer.getAddress();
      const newBalance = await contracts.provider.getBalance(address);
      setEthBalance(ethers.formatEther(newBalance));

      console.log(`📊 ${reason.toUpperCase()} completed: Sold ${position.token} for ${ethers.formatEther(sellQuote)} ETH (${finalPnl.toFixed(2)}% P&L)`);

    } catch (error) {
      console.error(`❌ Error executing ${reason} sell for ${position.token}:`, error);
    }
  };

  // Asynchronous pool validation (doesn't block pool detection)
  const validatePoolAsync = async (pool: PoolInfo) => {
    const poolAddress = pool.poolAddress;
    console.log(`🔍 Starting async validation for pool: ${poolAddress} (${pool.dex.toUpperCase()})`);

    // Set a longer timeout for validation (45 seconds max)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Validation timeout after 45 seconds')), 45000);
    });

    try {
      // Race between validation and timeout
      const validationPromise = validatePool(pool);
      const isValid = await Promise.race([validationPromise, timeoutPromise]);

      console.log(`✅ Validation completed for pool ${poolAddress}: ${isValid ? 'VALID' : 'INVALID'}`);

      // Update pool validation status in UI
      setPools(prev => prev.map(p =>
        p.poolAddress === poolAddress
          ? { ...p, isValid: isValid as boolean, validationChecked: true }
          : p
      ));

      if (isActive && (isValid as boolean)) {
        console.log(`🎯 Executing snipe on validated pool: ${poolAddress}`);
        await executeSnipe(pool);
      } else if (!(isValid as boolean)) {
        console.log(`❌ Pool ${poolAddress} failed validation - skipping`);
      }
    } catch (error) {
      console.error(`❌ Async validation failed for pool ${poolAddress}:`, error instanceof Error ? error.message : String(error));

      // On timeout or error, try a simplified validation as fallback
      console.log(`🔄 Trying simplified validation for ${poolAddress}...`);

      try {
        const quickValid = await quickValidatePool(pool);
        console.log(`📊 Fallback validation result for ${poolAddress}: ${quickValid ? 'VALID' : 'INVALID'}`);

        // Update with fallback result
        setPools(prev => prev.map(p =>
          p.poolAddress === poolAddress
            ? { ...p, isValid: quickValid, validationChecked: true }
            : p
        ));

        if (isActive && quickValid) {
          console.log(`🎯 Executing snipe on fallback-validated pool: ${poolAddress}`);
          await executeSnipe(pool);
        }
      } catch (fallbackError) {
        console.error(`❌ Fallback validation also failed for ${poolAddress}`);
        // Mark as invalid on complete failure
        setPools(prev => prev.map(p =>
          p.poolAddress === poolAddress
            ? { ...p, isValid: false, validationChecked: true }
            : p
        ));
      }
    }
  };

  // Quick validation fallback (minimal checks)
  const quickValidatePool = async (pool: PoolInfo): Promise<boolean> => {
    const contracts = (window as any).contracts;
    if (!contracts) return false;

    try {
      console.log(`⚡ Quick validation for ${pool.poolAddress}`);

      // Just check if we can get a single quote
      const testAmount = ethers.parseEther("0.001");
      const targetToken = pool.token0.toLowerCase() === WETH_ADDRESS.toLowerCase() ? pool.token1 : pool.token0;

      await contracts.quoter.quoteExactInputSingle(
        WETH_ADDRESS,
        targetToken,
        pool.fee,
        testAmount,
        0
      );

      console.log(`✅ Quick validation passed for ${pool.poolAddress}`);
      return true;

    } catch (error) {
      console.log(`❌ Quick validation failed for ${pool.poolAddress}`);
      return false;
    }
  };

  // Ultra-simple validation (just one quote attempt)
  const ultraSimpleValidate = async (pool: PoolInfo) => {
    const contracts = (window as any).contracts;
    const poolAddress = pool.poolAddress;

    console.log(`🚀 Ultra-simple validation for ${poolAddress}`);

    try {
      // Single quote attempt
      const testAmount = ethers.parseEther("0.001");
      const targetToken = pool.token0.toLowerCase() === WETH_ADDRESS.toLowerCase() ? pool.token1 : pool.token0;

      await contracts.quoter.quoteExactInputSingle(
        WETH_ADDRESS,
        targetToken,
        pool.fee,
        testAmount,
        0
      );

      console.log(`✅ ${poolAddress} PASSED validation - tradable!`);
      // Mark as valid
      setPools(prev => prev.map(p =>
        p.poolAddress === poolAddress
          ? { ...p, isValid: true, validationChecked: true }
          : p
      ));

      if (isActive) {
        console.log(`🎯 Sniping validated pool: ${poolAddress}`);
        await executeSnipe(pool);
      }

    } catch (error) {
      console.log(`❌ ${poolAddress} FAILED validation - not tradable`);
      console.error(`Validation error:`, error instanceof Error ? error.message : String(error));

      // Mark as invalid
      setPools(prev => prev.map(p =>
        p.poolAddress === poolAddress
          ? { ...p, isValid: false, validationChecked: true }
          : p
      ));
    }
  };

  // Validate pool before sniping
  const validatePool = async (pool: PoolInfo): Promise<boolean> => {
    const contracts = (window as any).contracts;
    if (!contracts) {
      console.log("❌ No contracts available for validation");
      return false;
    }

    try {
      console.log(`🔍 Validating pool: ${pool.poolAddress} (${pool.dex.toUpperCase()})`);

      // 1. Basic contract existence check (quick)
      try {
        const poolCode = await contracts.provider.getCode(pool.poolAddress);
        if (poolCode === "0x") {
          console.log("❌ Pool contract has no code");
          return false;
        }
        console.log("✅ Pool contract exists");
      } catch (codeError) {
        console.log("⚠️ Could not check pool code:", codeError instanceof Error ? codeError.message : String(codeError));
        // Continue validation - some RPCs may have issues
      }

      // 2. Token validation
      const targetToken = pool.token0.toLowerCase() === WETH_ADDRESS.toLowerCase() ? pool.token1 : pool.token0;
      try {
        const tokenCode = await contracts.provider.getCode(targetToken);
        if (tokenCode === "0x") {
          console.log("❌ Target token has no code");
          return false;
        }
        console.log("✅ Target token exists");
      } catch (tokenError) {
        console.log("⚠️ Could not check token code:", tokenError instanceof Error ? tokenError.message : String(tokenError));
        // Continue - token might exist but RPC has issues
      }

      // 3. Try to get a quote with multiple approaches
      const testAmounts = [
        ethers.parseEther("0.001"),   // 0.001 ETH - standard test
        ethers.parseEther("0.0001"),  // 0.0001 ETH - smaller test
        ethers.parseEther("0.00001"), // 0.00001 ETH - micro test
      ];

      let hasLiquidity = false;
      let lastQuoteError = null;

      for (const testAmount of testAmounts) {
        try {
          console.log(`🔄 Testing quote with ${ethers.formatEther(testAmount)} ETH...`);

          // Try both directions (WETH -> token and token -> WETH)
          const quotePromises = [
            // WETH -> token
            contracts.quoter.quoteExactInputSingle(
              WETH_ADDRESS,
              targetToken,
              pool.fee,
              testAmount,
              0
            ),
            // token -> WETH (if we have some tokens to test)
            contracts.quoter.quoteExactInputSingle(
              targetToken,
              WETH_ADDRESS,
              pool.fee,
              ethers.parseEther("1"), // 1 token if possible
              0
            ).catch(() => null) // Ignore reverse quote failures
          ];

          const [forwardQuote] = await Promise.all(quotePromises);

          if (forwardQuote && forwardQuote > 0) {
            console.log(`✅ Pool has working liquidity (quoted ${ethers.formatEther(forwardQuote)} tokens for ${ethers.formatEther(testAmount)} ETH)`);
            hasLiquidity = true;
            break;
          }
        } catch (quoteError) {
          lastQuoteError = quoteError;
          console.log(`⚠️ Quote failed with ${ethers.formatEther(testAmount)} ETH:`, quoteError instanceof Error ? quoteError.message : String(quoteError));
          continue;
        }
      }

      // If we have liquidity from quotes, consider pool valid regardless of other checks
      if (hasLiquidity) {
        console.log("✅ Pool has confirmed liquidity from quotes - marking as valid for trading");
        return true; // Prioritize working quotes over other checks
      }

      // AGGRESSIVE FALLBACK: If quotes fail but this is a new pool (recent timestamp),
      // it might be a network/RPC issue. Be more lenient for very recent pools.
      const poolAge = Date.now() - pool.timestamp;
      const isVeryRecent = poolAge < 300000; // Less than 5 minutes old

      if (isVeryRecent) {
        console.log(`🎯 Pool is very recent (${Math.floor(poolAge/1000)}s old) - applying lenient validation`);

        // For very recent pools, if basic checks pass, consider valid
        try {
          // Quick basic checks
          const poolCode = await contracts.provider.getCode(pool.poolAddress);
          if (poolCode === "0x") {
            console.log("❌ Recent pool has no contract code");
            return false;
          }

          const targetToken = pool.token0.toLowerCase() === WETH_ADDRESS.toLowerCase() ? pool.token1 : pool.token0;
          const tokenCode = await contracts.provider.getCode(targetToken);
          if (tokenCode === "0x") {
            console.log("❌ Recent pool target token has no code");
            return false;
          }

          console.log("✅ Recent pool passed basic checks - marking as valid");
          return true; // Lenient validation for new pools

        } catch (lenientError) {
          console.log("⚠️ Recent pool lenient validation failed:", lenientError instanceof Error ? lenientError.message : String(lenientError));
          return false;
        }
      }

      // If all quotes failed and pool is not very recent, reject it
      console.log("❌ All quote attempts failed and pool is not recent - rejecting");
      if (lastQuoteError) {
        console.log("Last quote error:", lastQuoteError instanceof Error ? lastQuoteError.message : String(lastQuoteError));
      }
      return false;


    } catch (error) {
      console.error("❌ Pool validation error:", error);
      return false;
    }
  };

  // Calculate total portfolio P&L
  const calculatePortfolioPnl = () => {
    const currentBalance = parseFloat(ethBalance);
    const initialBalance = parseFloat(initialEthBalance);

    // Calculate unrealized P&L from positions
    const unrealizedPnl = positions.reduce((total, position) => {
      const positionValue = parseFloat(position.amountBought) * parseFloat(position.currentPrice);
      const costBasis = parseFloat(position.ethSpent);
      const positionPnl = positionValue - costBasis;
      return total + positionPnl;
    }, 0);

    // Total P&L = (Current Balance - Initial Balance) + Unrealized P&L
    const totalPnl = (currentBalance - initialBalance) + unrealizedPnl;
    const totalPnlPercent = initialBalance > 0 ? (totalPnl / initialBalance) * 100 : 0;

    return {
      totalPnl,
      totalPnlPercent,
      unrealizedPnl
    };
  };

  const stopSniping = () => {
    setIsActive(false);
    setStatus("Sniping stopped");
    console.log("🛑 Sniping mode deactivated");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🚀 Crypto Sniper Bot (Uniswap V2/V3)</h1>

      <div style={{ marginBottom: "20px" }}>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>ETH Balance:</strong> {ethBalance} ETH</p>
        {(() => {
          const pnl = calculatePortfolioPnl();
          return (
            <div style={{
              padding: "10px",
              backgroundColor: pnl.totalPnl >= 0 ? "#e8f5e8" : "#ffebee",
              border: `2px solid ${pnl.totalPnl >= 0 ? "#28a745" : "#dc3545"}`,
              borderRadius: "8px",
              marginTop: "10px"
            }}>
              <h3 style={{ margin: "0 0 8px 0", color: pnl.totalPnl >= 0 ? "#28a745" : "#dc3545" }}>
                📈 Portfolio P&L: {pnl.totalPnl >= 0 ? "+" : ""}{pnl.totalPnl.toFixed(4)} ETH ({pnl.totalPnlPercent >= 0 ? "+" : ""}{pnl.totalPnlPercent.toFixed(2)}%)
              </h3>
              <div style={{ fontSize: "14px", color: "#666" }}>
                <span><strong>Realized:</strong> {(pnl.totalPnl - pnl.unrealizedPnl).toFixed(4)} ETH | </span>
                <span><strong>Unrealized:</strong> {pnl.unrealizedPnl.toFixed(4)} ETH | </span>
                <span><strong>Positions:</strong> {positions.length}</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>
          Amount per snipe (ETH):
          <input
            type="number"
            step="0.001"
            value={amountInEth}
            onChange={(e) => setAmountInEth(e.target.value)}
            disabled={isActive}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </label>
        <br />
        <label>
          Slippage (%):
          <input
            type="number"
            step="0.1"
            value={slippagePercent}
            onChange={(e) => setSlippagePercent(e.target.value)}
            disabled={isActive}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={startSniping}
          disabled={isActive || status.includes("not installed") || status.includes("Error")}
          style={{
            padding: "10px 20px",
            backgroundColor: isActive ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            marginRight: "10px",
            cursor: isActive ? "not-allowed" : "pointer"
          }}
        >
          Start Sniping
        </button>
        <button
          onClick={stopSniping}
          disabled={!isActive}
          style={{
            padding: "10px 20px",
            backgroundColor: !isActive ? "#ccc" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: !isActive ? "not-allowed" : "pointer"
          }}
        >
          Stop
        </button>
      </div>

      {/* Current Positions Section */}
      {positions.length > 0 && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f0f8ff", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h3>📊 Current Positions ({positions.length})</h3>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {positions.map((position, index) => (
              <div
                key={index}
                style={{
                  flex: "1",
                  minWidth: "200px",
                  padding: "10px",
                  backgroundColor: "white",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <p><strong>{position.token.slice(0, 6)}...</strong> <span style={{ fontSize: "10px", backgroundColor: position.dex === 'v3' ? "#007bff" : "#28a745", color: "white", padding: "2px 4px", borderRadius: "3px" }}>{position.dex.toUpperCase()}</span></p>
                <p><strong>Held:</strong> {parseFloat(position.amountBought).toFixed(2)} tokens</p>
                <p><strong>Cost:</strong> {parseFloat(position.ethSpent).toFixed(4)} ETH</p>
                <p><strong>Avg Price:</strong> {parseFloat(position.buyPrice).toFixed(8)} ETH/token</p>
                <p><strong>Current:</strong> {parseFloat(position.currentPrice).toFixed(8)} ETH/token</p>
                <p style={{ color: position.pnl >= 0 ? "#28a745" : "#dc3545", fontWeight: "bold" }}>
                  <strong>P&L:</strong> {position.pnl >= 0 ? "+" : ""}{position.pnl.toFixed(2)}%
                </p>
                <p style={{ fontSize: "11px", color: "#666" }}>
                  Bought: {new Date(position.buyTimestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "#666", marginTop: "10px" }}>
            🔴 Stop-Loss: -1% | 🟢 Take-Profit: +6% | Monitoring every 30 seconds
          </p>
        </div>
      )}

      {/* Full-width Pools Table */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ color: "#ffffff", marginBottom: "10px" }}>Recent Pools Created (Last 50)</h3>
        {pools.length === 0 ? (
          <p style={{ color: "#cccccc" }}>No pools detected yet</p>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #444444", borderRadius: "5px" }}>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "100px 60px 90px 60px 60px 70px 80px 60px",
              gap: "6px",
              padding: "10px 12px",
              backgroundColor: "#1a1a1a",
              borderBottom: "1px solid #444444",
              fontSize: "13px",
              fontWeight: "bold",
              color: "#ffffff"
            }}>
              <div>Pool Address</div>
              <div>DEX</div>
              <div>Token0</div>
              <div>Token1</div>
              <div>Fee</div>
              <div>Valid</div>
              <div>Status</div>
              <div>Time</div>
            </div>

            {/* Table Rows */}
            {pools.map((pool, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 60px 90px 60px 60px 70px 80px 60px",
                  gap: "6px",
                  padding: "8px 12px",
                  backgroundColor: pool.sniped ? "#2d4a22" : (index % 2 === 0 ? "#2a2a2a" : "#252525"),
                  borderBottom: "1px solid #333333",
                  fontSize: "12px",
                  color: "#cccccc",
                  alignItems: "center"
                }}
              >
                <div>
                  <a
                    href={`https://etherscan.io/address/${pool.poolAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#4FC3F7", textDecoration: "none", fontSize: "11px" }}
                    title={pool.poolAddress}
                  >
                    {pool.poolAddress.slice(0, 8)}...
                  </a>
                </div>
                <div>
                  <span style={{
                    fontSize: "10px",
                    backgroundColor: pool.dex === 'v3' ? "#0056b3" : "#1e7e34",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "3px",
                    fontWeight: "bold"
                  }}>
                    {pool.dex.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: "11px" }} title={pool.token0}>
                  {pool.token0.slice(0, 8)}...
                </div>
                <div style={{ fontSize: "11px" }} title={pool.token1}>
                  {pool.token1.slice(0, 8)}...
                </div>
                <div style={{ fontWeight: "bold" }}>{pool.fee / 10000}%</div>
                <div style={{ fontSize: "14px", textAlign: "center" }}>
                  {pool.validationChecked ? (
                    pool.isValid ? (
                      <span style={{ color: "#4CAF50" }} title="Pool is valid for trading">✅</span>
                    ) : (
                      <span style={{ color: "#f44336" }} title="Pool failed validation">❌</span>
                    )
                  ) : (
                    <span style={{ color: "#ff9800" }} title="Validation pending">⏳</span>
                  )}
                </div>
                <div style={{ color: pool.sniped ? "#4CAF50" : "#cccccc", fontSize: "14px" }}>
                  {pool.sniped ? "🎯 Sniped" : "👀 Watching"}
                </div>
                <div style={{ fontSize: "11px" }}>
                  {new Date(pool.timestamp).toLocaleTimeString().slice(0, 5)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-width Trades Section */}
      <div>
        <h3>Recent Trades</h3>
        {trades.length === 0 ? (
          <p>No trades yet</p>
        ) : (
          <div style={{ maxHeight: "300px", overflowY: "auto", display: "grid", gap: "10px" }}>
            {trades.map((trade, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  padding: "12px",
                  backgroundColor: trade.success ? "#e8f5e8" : "#ffebee",
                  borderRadius: "5px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr auto",
                  gap: "15px",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong style={{ color: "#333" }}>Token:</strong> <span style={{ color: "#666" }}>{trade.token}</span>
                </div>
                <div>
                  <strong style={{ color: "#333" }}>Type:</strong> <span style={{ color: trade.type === 'buy' ? "#28a745" : "#dc3545", fontWeight: "bold" }}>{trade.type.toUpperCase()}</span>
                </div>
                <div>
                  <strong style={{ color: "#333" }}>{trade.type === 'buy' ? 'Amount In:' : 'Amount Out:'}</strong> <span style={{ color: "#666" }}>{trade.amountIn} ETH</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: trade.success ? "#28a745" : "#dc3545", fontSize: "18px" }}>
                    {trade.success ? "✅" : "❌"}
                  </div>
                  {trade.txHash && (
                    <a
                      href={`https://etherscan.io/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#007bff", textDecoration: "none", fontSize: "12px" }}
                    >
                      View TX
                    </a>
                  )}
                </div>
                {trade.pnl !== undefined && (
                  <div style={{
                    gridColumn: "1 / -1",
                    marginTop: "5px",
                    padding: "5px",
                    backgroundColor: trade.pnl >= 0 ? "#e8f5e8" : "#ffebee",
                    borderRadius: "3px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: trade.pnl >= 0 ? "#28a745" : "#dc3545"
                  }}>
                    P&L: {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <p><strong>📊 Token Discovery:</strong> This bot monitors <strong>Uniswap V2/V3 PairCreated/PoolCreated events</strong> directly from the blockchain.</p>
        <p><strong>DEX Contracts:</strong> V2 (0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f) | V3 (0x1F98431c8aD98523631AE4a59f267346ea31F984)</p>
        <p><strong>🔍 Alternative Token Discovery Tools:</strong></p>
        <ul style={{ marginLeft: "20px" }}>
          <li><a href="https://dexscreener.com/" target="_blank" rel="noopener noreferrer">DexScreener</a> - Real-time DEX pair monitoring</li>
          <li><a href="https://dextools.io/" target="_blank" rel="noopener noreferrer">DexTools</a> - Advanced DEX analytics</li>
          <li><a href="https://www.dexview.com/" target="_blank" rel="noopener noreferrer">DexView</a> - New token discovery</li>
          <li><a href="https://www.geckoterminal.com/" target="_blank" rel="noopener noreferrer">GeckoTerminal</a> - Multi-chain DEX data</li>
        </ul>
        <p><strong>⚠️ Warning:</strong> This bot trades automatically. Use at your own risk. Only trade with funds you can afford to lose.</p>
        <p>Monitor the console for detailed logs and pool detection activity.</p>
      </div>
    </div>
  );
}
