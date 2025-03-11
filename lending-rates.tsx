"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { RefreshCcw, TrendingUp, Percent } from "lucide-react"

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

interface LendingRatesProps {
  lendingRateHistory: LendingRateHistory[]
  lendingRateSummaries: Record<string, LendingRateSummary>
  onRefresh: () => void
  isLoading: boolean
}

export default function LendingRates({
  lendingRateHistory,
  lendingRateSummaries,
  onRefresh,
  isLoading,
}: LendingRatesProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("BTC")
  const [activeTab, setActiveTab] = useState<string>("summary")

  // Filter history data for the selected currency
  const filteredHistory = lendingRateHistory.filter((item) => item.ccy === selectedCurrency)

  // Format data for the chart
  const chartData = filteredHistory.map((item) => ({
    date: new Date(Number.parseInt(item.ts)).toLocaleDateString(),
    rate: Number.parseFloat(item.rate) * 100, // Convert to percentage
  }))

  // Get the summary for the selected currency
  const selectedSummary = lendingRateSummaries[selectedCurrency]

  // Available currencies (derived from the summaries)
  const availableCurrencies = Object.keys(lendingRateSummaries)

  return (
    <Card className="w-full bg-gray-900 border border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 text-transparent bg-clip-text">
              Simple Earn Flexible
            </CardTitle>
            <CardDescription className="text-gray-400">OKX lending rates and earning opportunities</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="summary" className="data-[state=active]:bg-gray-700">
                  Summary
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">
                  Rate History
                </TabsTrigger>
              </TabsList>

              <div className="ml-4 w-32">
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {availableCurrencies.map((ccy) => (
                      <SelectItem key={ccy} value={ccy}>
                        {ccy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="summary" className="mt-4">
              {selectedSummary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Average Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <Percent className="w-5 h-5 mr-2 text-blue-400" />
                          <span className="text-2xl font-bold text-white">
                            {(Number.parseFloat(selectedSummary.avgRate) * 100).toFixed(4)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Highest Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                          <span className="text-2xl font-bold text-white">
                            {(Number.parseFloat(selectedSummary.highestRate) * 100).toFixed(4)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Lowest Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-red-400 transform rotate-180" />
                          <span className="text-2xl font-bold text-white">
                            {(Number.parseFloat(selectedSummary.lowestRate) * 100).toFixed(4)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">Rate Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[
                              { name: "Lowest", value: Number.parseFloat(selectedSummary.lowestRate) * 100 },
                              { name: "Average", value: Number.parseFloat(selectedSummary.avgRate) * 100 },
                              { name: "Highest", value: Number.parseFloat(selectedSummary.highestRate) * 100 },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <XAxis dataKey="name" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" tickFormatter={(value) => `${value.toFixed(4)}%`} />
                            <Tooltip
                              formatter={(value: number) => [`${value.toFixed(4)}%`, "Rate"]}
                              contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                              labelStyle={{ color: "#e5e7eb" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#1f2937" }}
                              activeDot={{ r: 8, fill: "#60a5fa", strokeWidth: 2, stroke: "#1f2937" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="text-xs text-gray-500 mt-2">
                    Last updated: {new Date(Number.parseInt(selectedSummary.ts)).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No summary data available for {selectedCurrency}</div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {filteredHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `${value.toFixed(4)}%`} />
                        <Tooltip
                          formatter={(value: number) => [`${value.toFixed(4)}%`, "Rate"]}
                          contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151" }}
                          labelStyle={{ color: "#e5e7eb" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rate"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#1f2937" }}
                          activeDot={{ r: 6, fill: "#60a5fa", strokeWidth: 2, stroke: "#1f2937" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-blue-400">Date</TableHead>
                        <TableHead className="text-green-400">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {new Date(Number.parseInt(item.ts)).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-green-400">
                            {(Number.parseFloat(item.rate) * 100).toFixed(4)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No historical data available for {selectedCurrency}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent></CardContent>
    </Card>
  )
}

