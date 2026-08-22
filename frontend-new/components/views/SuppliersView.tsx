'use client'

import React, { useState } from 'react'
import { Building2, Star, Plus, CheckCircle2, ShieldAlert, Award, Clock, ArrowUpRight, Compass, MapPin } from 'lucide-react'
import { SupplierItem } from '@/lib/mockData'
import GlobalMap from '@/components/ui/GlobalMap'

interface SuppliersViewProps {
  suppliers: SupplierItem[]
  onAddSupplier: (supplier: SupplierItem) => void
}

export default function SuppliersView({ suppliers, onAddSupplier }: SuppliersViewProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Semiconductor & Electronics')
  const [location, setLocation] = useState('Yokohama, Japan')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    const newSupplier: SupplierItem = {
      id: `SUP-0${suppliers.length + 1}`,
      name,
      category,
      rating: 4.8,
      onTimeDeliveryRate: 95.5,
      activeOrders: 5,
      location,
      status: 'Active'
    }
    onAddSupplier(newSupplier)
    setIsAdding(false)
    setName('')
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">PARTNERS & PORT AUTHORITIES</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Supplier & Port Directory</h2>
          <p className="text-xs text-[#6e6e73]">Carrier scorecard, dwell-time compliance, and global port distribution</p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition"
        >
          <Plus className="size-4" /> Add Verified Supplier
        </button>
      </div>

      {/* 2D World Map for Global Suppliers and Ports */}
      <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,.08)]">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-[#087ef5]" />
            <h3 className="text-sm font-semibold tracking-tight text-[#1d1d1f]">Global Supplier & Port Authority Network Map</h3>
            <span className="ml-2 rounded-full bg-[#e8f8ed] px-2.5 py-0.5 text-[9px] font-semibold text-[#34c759]">
              SUPPLIER HUBS LIVE
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-[#86868b]">
            Interactive Dwell & Hub Geolocation
          </span>
        </div>

        <div className="relative">
          <GlobalMap />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="rounded-2xl border border-[#d2d2d7] bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#087ef5]/10 text-[#087ef5]">
                <Building2 className="size-4" />
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${
                supplier.status === 'Active' ? 'bg-[#e8f8ed] text-[#34c759]' : 'bg-[#fff5eb] text-[#ff9f0a]'
              }`}>
                {supplier.status}
              </span>
            </div>

            <h3 className="mt-3 text-sm font-semibold text-[#1d1d1f] leading-snug">{supplier.name}</h3>
            <p className="text-[10px] text-[#86868b] leading-snug mt-0.5">{supplier.category} · {supplier.location}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#f0f0f2] pt-3 text-xs">
              <div>
                <span className="text-[9px] text-[#86868b]">Rating:</span>
                <p className="flex items-center gap-1 font-semibold text-[#1d1d1f]">
                  <Star className="size-3 fill-[#ff9f0a] text-[#ff9f0a]" /> {supplier.rating}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-[#86868b]">On-Time Rate:</span>
                <p className="font-semibold text-[#34c759]">{supplier.onTimeDeliveryRate}%</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#f0f0f2] pt-2.5 text-[10px]">
              <span className="text-[#86868b]">Active Orders: <strong className="text-[#1d1d1f]">{supplier.activeOrders}</strong></span>
              <button className="flex items-center gap-1 text-[#087ef5] font-semibold hover:underline">
                View Dwell <ArrowUpRight className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d2d2d7] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Add New Supplier</h3>
            <p className="text-xs text-[#86868b] mt-0.5">Register a logistics partner or manufacturing vendor</p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Company Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Pacific Marine Logistics" 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Category</label>
                <input 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Primary Port / Hub Location</label>
                <input 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                />
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
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
