"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Trash2, Plus, Info, DollarSign, RefreshCcw, Shield, Percent } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// Add imports for the LendingRates component
import LendingRates from "./components/lending-rates"

// SPX2.0 Contract ABI (Partial - Key Functions)
const SPX_CONTRACT_ABI = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_BuyTax",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_SellTax",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_maxTxAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "_maxWalletSize",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

// SPX2.0 Contract Address on Ethereum
const SPX_CONTRACT_ADDRESS = "0xYourContractAddressHere"

interface Asset {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  volumeChange24h: number
  priceHistory: { price: number; time: string }[]
  high24h: number
  low24h: number
  totalSupply: number
  type: "stock" | "etf" | "crypto" | "token"
  contractAddress?: string
  buyTax?: number
  sellTax?: number
  maxTxAmount?: number
  maxWalletSize?: number
  verified?: boolean
  lastUpdated?: string
}

interface ApiConfigItem {
  name: string
  endpoint: string
  apiKey: string
  requiresApiKey: boolean
  description: string
  documentation: string
  status: "active" | "maintenance" | "deprecated"
}

// API Configuration for Real-Time Data
const API_CONFIG: Record<string, ApiConfigItem> = {
  coinGecko: {
    name: "CoinGecko",
    endpoint: "https://api.coingecko.com/api/v3",
    apiKey: "YOUR_COINGECKO_API_KEY", // Replace with your API key
    requiresApiKey: true,
    description: "Comprehensive cryptocurrency data API",
    documentation: "https://www.coingecko.com/api/documentation",
    status: "active",
  },
  twelveData: {
    name: "Twelve Data",
    endpoint: "https://api.twelvedata.com",
    apiKey: "YOUR_TWELVEDATA_API_KEY", // Replace with your API key
    requiresApiKey: true,
    description: "Real-time and historical market data for stocks, ETFs, and more",
    documentation: "https://twelvedata.com/docs",
    status: "active",
  },
  etherscan: {
    name: "Etherscan",
    endpoint: "https://api.etherscan.io/api",
    apiKey: "M7E5I8X3DZ4W2JK53ZKQ4WR2PVPFF1H3MI", // Etherscan API key
    requiresApiKey: true,
    description: "Ethereum blockchain explorer API for token and contract data",
    documentation: "https://docs.etherscan.io",
    status: "active",
  },
  okx: {
    name: "OKX",
    endpoint: "https://www.okx.com",
    apiKey: "YOUR_OKX_API_KEY", // Replace with your API key
    requiresApiKey: true,
    description: "OKX cryptocurrency exchange API for trading and financial products",
    documentation: "https://www.okx.com/docs-v5/en/",
    status: "active",
  },
}

// Add interfaces for OKX lending rate data
interface LendingRateHistory {
  ccy: string
  rate: string
  ts: string
}

interface LendingRateSummary {
  ccy: string
  avgRate: string
  highestRate: string
  lowestRate: string
  ts: string
}

// Add functions to fetch OKX lending rate data
const fetchLendingRateHistory = async (
  ccy: string | null = null,
  after: string | null = null,
  before: string | null = null,
  limit: string | null = null,
) => {
  try {
    const params = new URLSearchParams()
    if (ccy) params.append("ccy", ccy)
    if (after) params.append("after", after)
    if (before) params.append("before", before)
    if (limit) params.append("limit", limit)

    const response = await fetch(
      `${API_CONFIG.okx.endpoint}/api/v5/finance/savings/lending-rate-history?${params.toString()}`,
      {
        headers: {
          "OK-ACCESS-KEY": API_CONFIG.okx.apiKey,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching lending rate history:", error)
    return null
  }
}

const fetchLendingRateSummary = async (ccy: string) => {
  try {
    const response = await fetch(`${API_CONFIG.okx.endpoint}/api/v5/finance/savings/lending-rate-summary?ccy=${ccy}`, {
      headers: {
        "OK-ACCESS-KEY": API_CONFIG.okx.apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching lending rate summary:", error)
    return null
  }
}

// Add mock data for lending rates
const mockLendingRateHistory: LendingRateHistory[] = [
  { ccy: "BTC", rate: "0.0012", ts: "1646092800000" },
  { ccy: "BTC", rate: "0.0014", ts: "1646179200000" },
  { ccy: "BTC", rate: "0.0011", ts: "1646265600000" },
  { ccy: "BTC", rate: "0.0013", ts: "1646352000000" },
  { ccy: "BTC", rate: "0.0015", ts: "1646438400000" },
  { ccy: "ETH", rate: "0.0018", ts: "1646092800000" },
  { ccy: "ETH", rate: "0.0020", ts: "1646179200000" },
  { ccy: "ETH", rate: "0.0019", ts: "1646265600000" },
  { ccy: "ETH", rate: "0.0021", ts: "1646352000000" },
  { ccy: "ETH", rate: "0.0022", ts: "1646438400000" },
]

const mockLendingRateSummaries: Record<string, LendingRateSummary> = {
  BTC: { ccy: "BTC", avgRate: "0.0013", highestRate: "0.0015", lowestRate: "0.0011", ts: "1646438400000" },
  ETH: { ccy: "ETH", avgRate: "0.0020", highestRate: "0.0022", lowestRate: "0.0018", ts: "1646438400000" },
  SOL: { ccy: "SOL", avgRate: "0.0025", highestRate: "0.0030", lowestRate: "0.0020", ts: "1646438400000" },
  USDT: { ccy: "USDT", avgRate: "0.0040", highestRate: "0.0045", lowestRate: "0.0035", ts: "1646438400000" },
}

// Function to fetch real-time data from CoinGecko
const fetchCryptoData = async (symbol: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.coinGecko.endpoint}/coins/markets?vs_currency=usd&ids=${symbol.toLowerCase()}&x_cg_pro_api_key=${API_CONFIG.coinGecko.apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    if (data && data.length > 0) {
      return data[0]
    }
    return null
  } catch (error) {
    console.error("Error fetching crypto data:", error)
    return null
  }
}

// Function to fetch stock data from Twelve Data
const fetchStockData = async (symbol: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.twelveData.endpoint}/quote?symbol=${symbol}&apikey=${API_CONFIG.twelveData.apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching stock data:", error)
    return null
  }
}

// Function to fetch token data from Etherscan
const fetchTokenData = async (contractAddress: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.etherscan.endpoint}?module=token&action=tokeninfo&contractaddress=${contractAddress}&apikey=${API_CONFIG.etherscan.apiKey}`,
    )

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching token data:", error)
    return null
  }
}

// Function to fetch SPX2.0 contract data - this simulates Web3 integration
const fetchSPXContractData = async () => {
  // In a real implementation, this would use web3.js or ethers.js to call the contract
  try {
    // Simulate contract call response
    return {
      totalSupply: 1000000000,
      buyTax: 20,
      sellTax: 30,
      maxTxAmount: 20000000,
      maxWalletSize: 20000000,
    }
  } catch (error) {
    console.error("Error fetching SPX contract data:", error)
    return null
  }
}

const generateRealisticMockData = (basePrice: number, volatility = 0.05, trend = 0.01) => {
  let currentPrice = basePrice
  const now = Date.now()
  return Array.from({ length: 30 }, (_, i) => {
    const randomFactor = Math.random() * 2 - 1 // Range from -1 to 1
    const trendFactor = Math.random() * 0.5 + 0.75 // 0.75 to 1.25, slightly biased towards positive
    const randomChange = (randomFactor * volatility + trend * trendFactor) * currentPrice
    currentPrice += randomChange
    currentPrice = Math.max(currentPrice, basePrice * 0.9) // Prevent price from going too low
    currentPrice = Math.min(currentPrice, basePrice * 1.1) // Prevent price from going too high
    const time = new Date(now - (29 - i) * 5 * 60 * 1000) // 5-minute intervals
    return {
      price: currentPrice,
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  })
}

// Added SPX2.0 token data
const initialAssets: Asset[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    price: 97845.0,
    change24h: 3.5,
    marketCap: 1920000000000,
    volume24h: 40000000000,
    volumeChange24h: 4.2,
    priceHistory: generateRealisticMockData(97845.0, 0.1, 0.03),
    high24h: 99000.0,
    low24h: 96000.0,
    totalSupply: 21000000,
    type: "crypto",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    price: 5230.0,
    change24h: 2.8,
    marketCap: 630000000000,
    volume24h: 20000000000,
    volumeChange24h: 3.1,
    priceHistory: generateRealisticMockData(5230.0, 0.09, 0.025),
    high24h: 5350.0,
    low24h: 5150.0,
    totalSupply: 120000000,
    type: "crypto",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "spx2.0",
    symbol: "SPX2.0",
    name: "SPX6900 2.0",
    price: 0.00042,
    change24h: 15.7,
    marketCap: 420000,
    volume24h: 50000,
    volumeChange24h: 22.3,
    priceHistory: generateRealisticMockData(0.00042, 0.2, 0.05),
    high24h: 0.00045,
    low24h: 0.00038,
    totalSupply: 1000000000,
    type: "token",
    contractAddress: SPX_CONTRACT_ADDRESS,
    buyTax: 20,
    sellTax: 30,
    maxTxAmount: 20000000,
    maxWalletSize: 20000000,
    verified: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    price: 185.5,
    change24h: 4.2,
    marketCap: 80000000000,
    volume24h: 5000000000,
    volumeChange24h: 5.5,
    priceHistory: generateRealisticMockData(185.5, 0.12, 0.035),
    high24h: 190.0,
    low24h: 180.0,
    totalSupply: 549846983,
    type: "crypto",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 175.2,
    change24h: 1.5,
    marketCap: 2750000000000,
    volume24h: 55000000,
    volumeChange24h: 2.2,
    priceHistory: generateRealisticMockData(175.2, 0.04, 0.015),
    high24h: 177.5,
    low24h: 174.0,
    totalSupply: 16000000000,
    type: "stock",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "googl",
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 152.5,
    change24h: 1.8,
    marketCap: 1920000000000,
    volume24h: 35000000,
    volumeChange24h: 2.5,
    priceHistory: generateRealisticMockData(152.5, 0.05, 0.02),
    high24h: 154.0,
    low24h: 151.0,
    totalSupply: 6600000000,
    type: "stock",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "qqq",
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    price: 430.5,
    change24h: 1.6,
    marketCap: 230000000000,
    volume24h: 88000000,
    volumeChange24h: 2.3,
    priceHistory: generateRealisticMockData(430.5, 0.03, 0.01),
    high24h: 433.0,
    low24h: 428.0,
    totalSupply: 530000000,
    type: "etf",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "spy",
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    price: 505.2,
    change24h: 1.2,
    marketCap: 455000000000,
    volume24h: 110000000,
    volumeChange24h: 1.8,
    priceHistory: generateRealisticMockData(505.2, 0.02, 0.008),
    high24h: 508.8,
    low24h: 503.5,
    totalSupply: 950000000,
    type: "etf",
    lastUpdated: new Date().toISOString(),
  },
]

const getBorderColor = (change: number) => {
  const absChange = Math.abs(change)
  if (change >= 0) {
    if (absChange >= 5) return "border-green-500"
    if (absChange >= 2) return "border-green-400"
    return "border-green-300"
  } else {
    if (absChange >= 5) return "border-red-500"
    if (absChange >= 2) return "border-red-400"
    return "border-red-300"
  }
}

const getGlowColor = (change: number) => {
  if (change >= 0) {
    return "shadow-[0_0_15px_rgba(34,197,94,0.5)]" // green glow
  } else {
    return "shadow-[0_0_15px_rgba(239,68,68,0.5)]" // red glow
  }
}

const getBorderWidth = (change: number) => {
  const absChange = Math.abs(change)
  if (absChange >= 5) return "border-4 hover:border-[6px]"
  if (absChange >= 2) return "border-2 hover:border-[4px]"
  return "border hover:border-2"
}

const simulatePriceChange = (asset: Asset): Asset => {
  const volatility = asset.type === "token" ? 0.006 : 0.003 // Higher volatility for tokens
  const trend = asset.type === "token" ? 0.001 : 0.0005
  const randomFactor = Math.random() * 2 - 1 // Range from -1 to 1
  const trendFactor = Math.random() * 0.5 + 0.75 // 0.75 to 1.25, slightly biased towards positive
  const randomChange = (randomFactor * volatility + trend * trendFactor) * asset.price
  const newPrice = asset.price + randomChange
  const newChange24h = (newPrice / asset.priceHistory[0].price - 1) * 100

  const now = new Date()
  const newPricePoint = {
    price: newPrice,
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }

  return {
    ...asset,
    price: newPrice,
    change24h: newChange24h,
    priceHistory: [...asset.priceHistory.slice(1), newPricePoint],
    high24h: Math.max(asset.high24h, newPrice),
    low24h: Math.min(asset.low24h, newPrice),
    lastUpdated: now.toISOString(),
  }
}

const CardFront = React.memo(({ asset, displayPrice }: { asset: Asset; displayPrice: number }) => (
  <motion.div
    key="front"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="absolute inset-0 p-5 flex flex-col justify-between backface-hidden"
  >
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 text-transparent bg-clip-text">
            {asset.symbol}
          </h2>
          {asset.type === "token" && asset.verified && (
            <Shield className="ml-1 w-4 h-4 text-green-400" title="Verified Contract" />
          )}
        </div>
        <p className="text-sm text-gray-400 font-medium truncate">{asset.name}</p>
        {asset.type === "token" && (
          <p className="text-xs text-gray-500 truncate">
            {asset.contractAddress?.substring(0, 6)}...
            {asset.contractAddress?.substring(asset.contractAddress.length - 4)}
          </p>
        )}
      </div>
      <div className={`flex items-center ${asset.change24h >= 0 ? "text-green-400" : "text-red-400"} font-semibold`}>
        {asset.change24h >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
        <span className="ml-1 text-lg">{asset.change24h.toFixed(2)}%</span>
      </div>
    </div>
    <div className="flex justify-between items-end">
      <div className="w-32 h-16 group-hover:opacity-75 transition-opacity duration-300 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={asset.priceHistory}>
            <Line
              type="monotone"
              dataKey="price"
              stroke={asset.change24h >= 0 ? "#4ade80" : "#f87171"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <YAxis domain={["dataMin", "dataMax"]} hide={true} />
            <Tooltip
              position={{ y: 0 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-lg absolute left-0 bottom-full mb-2">
                      <p className="text-white text-xs">${payload[0].value.toFixed(asset.price < 1 ? 8 : 2)}</p>
                      <p className="text-gray-400 text-xs">{payload[0].payload.time}</p>
                    </div>
                  )
                }
                return null
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-3xl font-bold text-white drop-shadow-glow transition-all duration-300">
        $
        {displayPrice < 0.01
          ? displayPrice.toExponential(2)
          : displayPrice.toLocaleString(undefined, {
              minimumFractionDigits: displayPrice < 1 ? 6 : 2,
              maximumFractionDigits: displayPrice < 1 ? 6 : 2,
            })}
      </p>
    </div>
  </motion.div>
))

const CardBack = React.memo(({ asset, onDelete }: { asset: Asset; onDelete: () => void }) => (
  <motion.div
    key="back"
    initial={{ opacity: 0, rotateY: 180 }}
    animate={{ opacity: 1, rotateY: 180 }}
    exit={{ opacity: 0, rotateY: 180 }}
    transition={{ duration: 0.2 }}
    className="absolute inset-0 p-4 flex flex-col backface-hidden [transform:rotateY(180deg)]"
  >
    <div className="flex flex-col justify-between items-center h-full text-center">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-teal-400 text-transparent bg-clip-text leading-tight">
          {asset.name}
        </h3>
        <p className="text-sm text-gray-400">({asset.symbol})</p>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs w-full">
        <p className="text-gray-300">
          Market Cap:{" "}
          <span className="font-medium text-teal-400">
            $
            {asset.marketCap >= 1e9
              ? (asset.marketCap / 1e9).toFixed(2) + "B"
              : asset.marketCap >= 1e6
                ? (asset.marketCap / 1e6).toFixed(2) + "M"
                : asset.marketCap.toLocaleString()}
          </span>
        </p>
        <p className="text-gray-300">
          24h Volume:{" "}
          <span className="font-medium text-blue-400">
            $
            {asset.volume24h >= 1e9
              ? (asset.volume24h / 1e9).toFixed(2) + "B"
              : asset.volume24h >= 1e6
                ? (asset.volume24h / 1e6).toFixed(2) + "M"
                : asset.volume24h.toLocaleString()}
          </span>
        </p>
        <p className="text-gray-300">
          24h High:{" "}
          <span className="font-medium text-green-400">
            $
            {asset.high24h < 0.01
              ? asset.high24h.toExponential(2)
              : asset.high24h.toLocaleString(undefined, {
                  minimumFractionDigits: asset.high24h < 1 ? 6 : 2,
                  maximumFractionDigits: asset.high24h < 1 ? 6 : 2,
                })}
          </span>
        </p>
        <p className="text-gray-300">
          24h Low:{" "}
          <span className="font-medium text-red-400">
            $
            {asset.low24h < 0.01
              ? asset.low24h.toExponential(2)
              : asset.low24h.toLocaleString(undefined, {
                  minimumFractionDigits: asset.low24h < 1 ? 6 : 2,
                  maximumFractionDigits: asset.low24h < 1 ? 6 : 2,
                })}
          </span>
        </p>
        <p className="text-gray-300 col-span-2">
          Total Supply: <span className="font-medium text-yellow-400">{asset.totalSupply.toLocaleString()}</span>
        </p>

        {/* Additional token info for SPX2.0 */}
        {asset.type === "token" && asset.buyTax !== undefined && (
          <>
            <p className="text-gray-300">
              Buy Tax: <span className="font-medium text-red-400">{asset.buyTax}%</span>
            </p>
            <p className="text-gray-300">
              Sell Tax: <span className="font-medium text-red-400">{asset.sellTax}%</span>
            </p>
          </>
        )}

        <p className="text-gray-300 col-span-2">
          Volume Change (24h):{" "}
          <span className={`font-medium ${asset.volumeChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
            {asset.volumeChange24h.toFixed(2)}%
          </span>
        </p>
      </div>
      <div className="flex justify-between items-center w-full">
        <p className="text-xl font-bold text-white">
          $
          {asset.price < 0.01
            ? asset.price.toExponential(2)
            : asset.price.toLocaleString(undefined, {
                minimumFractionDigits: asset.price < 1 ? 6 : 2,
                maximumFractionDigits: asset.price < 1 ? 6 : 2,
              })}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          aria-label={`Delete ${asset.name} from watchlist`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  </motion.div>
))

const AssetCard = React.memo(
  ({
    asset,
    isFlipped,
    onFlip,
    onDelete,
  }: {
    asset: Asset
    isFlipped: boolean
    onFlip: () => void
    onDelete: () => void
  }) => {
    const [displayPrice, setDisplayPrice] = useState(asset.price)

    useEffect(() => {
      const timer = setTimeout(() => {
        setDisplayPrice(asset.price)
      }, 300) // Slight delay for smooth transition

      return () => clearTimeout(timer)
    }, [asset.price])

    return (
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="perspective-1000"
      >
        <Card
          className={`relative w-full h-52 cursor-pointer transform-style-3d transition-all duration-300 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden hover:shadow-2xl hover:scale-105 hover:z-10 group ${
            asset.change24h >= 0 ? "bg-green-500/10" : "bg-red-500/10"
          } ${getBorderColor(asset.change24h)} ${getBorderWidth(asset.change24h)} ${getGlowColor(asset.change24h)} neon-flicker hover:border-black`}
          onClick={onFlip}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-teal-500/5 group-hover:via-blue-500/10 group-hover:to-teal-500/10 transition-all duration-300" />
          <AnimatePresence initial={false}>
            {!isFlipped ? (
              <CardFront asset={asset} displayPrice={displayPrice} />
            ) : (
              <CardBack asset={asset} onDelete={onDelete} />
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    )
  },
)

// New component for API data display
const ApiInfoTable = () => {
  return (
    <Card className="w-full bg-gray-900 p-4 mb-8">
      <h2 className="text-xl font-bold text-white mb-4">API Configuration</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-green-400">API Provider</TableHead>
            <TableHead className="text-blue-400">Status</TableHead>
            <TableHead className="text-yellow-400">Action Required</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(API_CONFIG).map(([key, api]) => (
            <TableRow key={key}>
              <TableCell className="font-medium text-green-400">
                {api.name}
                <div className="text-xs text-gray-400">{api.description}</div>
              </TableCell>
              <TableCell className={api.status === "active" ? "text-green-400" : "text-red-400"}>
                {api.status === "active" ? "Active" : api.status === "maintenance" ? "Maintenance" : "Deprecated"}
              </TableCell>
              <TableCell className="text-yellow-400">
                {api.requiresApiKey ? "Replace YOUR_API_KEY with actual API key" : "No action required"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

// New component for Smart Contract information
const SmartContractInfo = () => {
  return (
    <Card className="w-full bg-gray-900 p-4 mb-8">
      <h2 className="text-xl font-bold text-white mb-4">SPX2.0 Smart Contract Integration</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-green-400">Contract Function</TableHead>
            <TableHead className="text-blue-400">Data</TableHead>
            <TableHead className="text-yellow-400">Implementation Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium text-green-400">totalSupply()</TableCell>
            <TableCell className="text-blue-400">1,000,000,000 SPX2.0</TableCell>
            <TableCell className="text-yellow-400">Displayed in card details</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-green-400">_BuyTax(), _SellTax()</TableCell>
            <TableCell className="text-blue-400">20%, 30%</TableCell>
            <TableCell className="text-yellow-400">Displayed in token details</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-green-400">_maxTxAmount(), _maxWalletSize()</TableCell>
            <TableCell className="text-blue-400">20,000,000 SPX2.0</TableCell>
            <TableCell className="text-yellow-400">Anti-whale protection</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}

// Add state for lending rates data and loading state in the CryptoDashboard component
export default function CryptoDashboard() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLendingRatesLoading, setIsLendingRatesLoading] = useState(false)
  const [lendingRateHistory, setLendingRateHistory] = useState<LendingRateHistory[]>(mockLendingRateHistory)
  const [lendingRateSummaries, setLendingRateSummaries] =
    useState<Record<string, LendingRateSummary>>(mockLendingRateSummaries)

  // Filter assets based on active tab
  const filteredAssets = assets.filter((asset) => {
    if (activeTab === "all") return true
    return asset.type === activeTab
  })

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prevAssets) => prevAssets.map((asset) => simulatePriceChange(asset)))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Handle card flip
  const handleFlip = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Handle asset deletion
  const handleDelete = (id: string) => {
    setAssets((prevAssets) => prevAssets.filter((asset) => asset.id !== id))
    setFlippedCards((prev) => {
      const newFlipped = { ...prev }
      delete newFlipped[id]
      return newFlipped
    })
  }

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate API refresh
    setTimeout(() => {
      setAssets((prevAssets) => prevAssets.map((asset) => simulatePriceChange(asset)))
      setIsRefreshing(false)
    }, 1000)
  }

  // Handle lending rates refresh
  const handleLendingRatesRefresh = () => {
    setIsLendingRatesLoading(true)
    // Simulate API refresh for lending rates
    setTimeout(() => {
      // Simulate updated data by slightly modifying the rates
      const updatedHistory = lendingRateHistory.map((item) => ({
        ...item,
        rate: (Number.parseFloat(item.rate) * (0.95 + Math.random() * 0.1)).toFixed(6),
      }))

      const updatedSummaries = { ...lendingRateSummaries }
      Object.keys(updatedSummaries).forEach((ccy) => {
        const summary = updatedSummaries[ccy]
        updatedSummaries[ccy] = {
          ...summary,
          avgRate: (Number.parseFloat(summary.avgRate) * (0.95 + Math.random() * 0.1)).toFixed(6),
          highestRate: (Number.parseFloat(summary.highestRate) * (0.95 + Math.random() * 0.1)).toFixed(6),
          lowestRate: (Number.parseFloat(summary.lowestRate) * (0.95 + Math.random() * 0.1)).toFixed(6),
          ts: Date.now().toString(),
        }
      })

      setLendingRateHistory(updatedHistory)
      setLendingRateSummaries(updatedSummaries)
      setIsLendingRatesLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-teal-400 to-green-400 text-transparent bg-clip-text mb-2">
                Crypto & Asset Dashboard
              </h1>
              <p className="text-gray-400">Real-time market data with SPX2.0 smart contract integration</p>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 mr-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add Asset
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-800 border border-gray-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
                All Assets
              </TabsTrigger>
              <TabsTrigger value="crypto" className="data-[state=active]:bg-gray-700">
                Crypto
              </TabsTrigger>
              <TabsTrigger value="token" className="data-[state=active]:bg-gray-700">
                Tokens
              </TabsTrigger>
              <TabsTrigger value="stock" className="data-[state=active]:bg-gray-700">
                Stocks
              </TabsTrigger>
              <TabsTrigger value="etf" className="data-[state=active]:bg-gray-700">
                ETFs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-400" />
            Market Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isFlipped={!!flippedCards[asset.id]}
                onFlip={() => handleFlip(asset.id)}
                onDelete={() => handleDelete(asset.id)}
              />
            ))}
          </div>
        </div>

        {/* Add the new LendingRates component */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Percent className="w-5 h-5 mr-2 text-blue-400" />
            Lending Rates
          </h2>
          <LendingRates
            lendingRateHistory={lendingRateHistory}
            lendingRateSummaries={lendingRateSummaries}
            onRefresh={handleLendingRatesRefresh}
            isLoading={isLendingRatesLoading}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-400" />
            Technical Information
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApiInfoTable />
            <SmartContractInfo />
          </div>
        </div>
      </div>

      {/* Add custom CSS for 3D effects */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
        }
        
        .neon-flicker {
          animation: neonFlicker 8s infinite alternate;
        }
        
        @keyframes neonFlicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            box-shadow: inherit;
          }
          20%, 24%, 55% {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  )
}

