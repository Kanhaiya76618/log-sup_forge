'use client'

import React, { useState } from 'react'
import { Plus, Search, Filter, AlertTriangle, CheckCircle2, Box, ArrowUpDown, Trash2, Edit3, ShieldAlert } from 'lucide-react'
import { InventoryItem } from '@/lib/mockData'
import StatusBadge from '@/components/ui/StatusBadge'

interface InventoryViewProps {
  items: InventoryItem[]
  onAddItem: (item: InventoryItem) => void
  onUpdateStock: (sku: string, newStock: number) => void
}

export default function InventoryView({ items, onAddItem, onUpdateStock }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [isAdding, setIsAdding] = useState(false)
  
  // Form State
  const [sku, setSku] = useState('')
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('Automotive')
  const [stock, setStock] = useState(100)
  const [reorderPoint, setReorderPoint] = useState(50)
  const [warehouse, setWarehouse] = useState('Mumbai JNPT Port Buffer')
  const [unitCost, setUnitCost] = useState(500)

  const filteredItems = items.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = filterCategory === 'All' || item.category === filterCategory
    return matchesSearch && matchesCat
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku || !productName) return
    const newItem: InventoryItem = {
      sku,
      productName,
      category,
      stock: Number(stock),
      reorderPoint: Number(reorderPoint),
      warehouse,
      unitCost: Number(unitCost),
      status: Number(stock) === 0 ? 'Stockout' : Number(stock) <= Number(reorderPoint) ? 'Low Stock' : 'In Stock'
    }
    onAddItem(newItem)
    setIsAdding(false)
    setSku('')
    setProductName('')
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">WAREHOUSE & SKU MONITORING</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Inventory Management</h2>
          <p className="text-xs text-[#6e6e73]">Real-time stock levels, stockout prediction, and automated buffer alerts</p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition"
        >
          <Plus className="size-4" /> Add Inventory Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">TOTAL ITEMS IN STOCK</p>
          <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">{items.reduce((acc, curr) => acc + curr.stock, 0).toLocaleString()} Units</p>
          <p className="mt-1 text-xs text-[#34c759]">Across 4 global port terminals</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">LOW STOCK ALERTS</p>
          <p className="mt-2 text-2xl font-bold text-[#ff9f0a]">{items.filter(i => i.status === 'Low Stock').length} SKUs</p>
          <p className="mt-1 text-xs text-[#ff9f0a]">Reorder point breached</p>
        </div>
        <div className="rounded-2xl border border-[#d2d2d7] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[#86868b] uppercase">CRITICAL STOCKOUTS</p>
          <p className="mt-2 text-2xl font-bold text-[#ff3b30]">{items.filter(i => i.status === 'Stockout').length} SKUs</p>
          <p className="mt-1 text-xs text-[#ff3b30]">Immediate replenishment needed</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d2d2d7] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] px-2">
          <Search className="size-4 text-[#86868b]" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, product name..."
            className="w-full bg-transparent text-xs text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#86868b]">Category:</span>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-[#e5e5e7] bg-[#f5f5f7] px-3 py-1.5 text-xs text-[#1d1d1f] outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Automotive">Automotive</option>
            <option value="Electronics">Electronics</option>
            <option value="Energy">Energy</option>
            <option value="Machinery">Machinery</option>
            <option value="Pharma">Pharma</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1d1d1f]">
            <thead className="border-b border-[#e5e5e7] bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
              <tr>
                <th className="px-5 py-3.5">SKU</th>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Warehouse Location</th>
                <th className="px-5 py-3.5">Stock Level</th>
                <th className="px-5 py-3.5">Unit Cost</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f2]">
              {filteredItems.map((item) => (
                <tr key={item.sku} className="hover:bg-[#fafaf9] transition">
                  <td className="px-5 py-4 font-mono font-semibold text-[#087ef5]">{item.sku}</td>
                  <td className="px-5 py-4 font-medium text-[#1d1d1f]">{item.productName}</td>
                  <td className="px-5 py-4 text-[#6e6e73]">{item.category}</td>
                  <td className="px-5 py-4 text-[#6e6e73]">{item.warehouse}</td>
                  <td className="px-5 py-4 font-semibold">
                    <span className={item.stock <= item.reorderPoint ? 'text-[#ff3b30]' : 'text-[#1d1d1f]'}>
                      {item.stock}
                    </span>
                    <span className="text-[10px] font-normal text-[#86868b] ml-1">/ min {item.reorderPoint}</span>
                  </td>
                  <td className="px-5 py-4 font-mono text-[#6e6e73]">${item.unitCost.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => onUpdateStock(item.sku, item.stock + 50)}
                      className="flow-pill bg-[#f5f5f7] text-[#1d1d1f] border border-[#e5e5e7] hover:bg-[#e5e5e7] transition"
                    >
                      +50 Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d2d2d7] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Add New Inventory Item</h3>
            <p className="text-xs text-[#86868b] mt-0.5">Define new SKU parameters for real-time tracking</p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">SKU ID</label>
                <input 
                  value={sku} 
                  onChange={e => setSku(e.target.value)} 
                  placeholder="e.g. SKU-007" 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Product Name</label>
                <input 
                  value={productName} 
                  onChange={e => setProductName(e.target.value)} 
                  placeholder="e.g. Industrial Sensor Array" 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#6e6e73] mb-1">Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                  >
                    <option value="Automotive">Automotive</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Energy">Energy</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Pharma">Pharma</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#6e6e73] mb-1">Initial Stock</label>
                  <input 
                    type="number"
                    value={stock} 
                    onChange={e => setStock(Number(e.target.value))} 
                    className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e5e7]">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)} 
                  className="rounded-xl px-4 py-2 text-xs font-medium text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-[#087ef5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#076ecf]"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
