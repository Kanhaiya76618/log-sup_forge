'use client'

import React, { useState } from 'react'
import { Users, Shield, Plus, Key, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react'
import { UserAccessItem } from '@/lib/mockData'

interface UsersViewProps {
  users: UserAccessItem[]
  onAddUser: (user: UserAccessItem) => void
}

export default function UsersView({ users, onAddUser }: UsersViewProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserAccessItem['role']>('Logistics Officer')
  const [limit, setLimit] = useState('$100,000 USD')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    const newUser: UserAccessItem = {
      id: `USR-0${users.length + 1}`,
      name,
      email,
      role,
      department: role === 'System Administrator' ? 'Security & IT' : 'Maritime Operations',
      hitlApprovalLimit: limit,
      status: 'Active'
    }
    onAddUser(newUser)
    setIsAdding(false)
    setName('')
    setEmail('')
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-[#087ef5] uppercase">ACCESS CONTROL & PERMISSIONS</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.04em] text-[#1d1d1f]">Users & HITL Authority</h2>
          <p className="text-xs text-[#6e6e73]">Human-in-the-Loop decision limits, role assignments, and operator access controls</p>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-[#1d1d1f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-black transition"
        >
          <Plus className="size-4" /> Add Authorized User
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1d1d1f]">
            <thead className="border-b border-[#e5e5e7] bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">HITL Auto-Approval Limit</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f2]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#fafaf9] transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-[#1d1d1f] text-white font-semibold text-[10px]">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1d1d1f]">{user.name}</p>
                        <p className="text-[10px] text-[#86868b]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#1d1d1f]">{user.role}</td>
                  <td className="px-5 py-4 text-[#6e6e73]">{user.department}</td>
                  <td className="px-5 py-4 font-mono font-semibold text-[#087ef5]">{user.hitlApprovalLimit}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#e8f8ed] px-2.5 py-1 text-[9px] font-semibold text-[#34c759]">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="rounded-lg border border-[#e5e5e7] bg-[#f5f5f7] px-2.5 py-1 text-[10px] font-medium hover:bg-slate-200 transition">
                      Edit Roles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d2d2d7] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#1d1d1f]">Grant User Access</h3>
            <p className="text-xs text-[#86868b] mt-0.5">Assign Human-in-the-Loop decision approval limits</p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Full Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Captain Marcus Vance" 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#6e6e73] mb-1">Email Address</label>
                <input 
                  type="email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="marcus.v@flowforge.internal" 
                  required
                  className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#6e6e73] mb-1">Role</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full rounded-xl border border-[#e5e5e7] p-2.5 text-xs text-[#1d1d1f] outline-none"
                  >
                    <option value="System Administrator">System Administrator</option>
                    <option value="Logistics Officer">Logistics Officer</option>
                    <option value="Port Manager">Port Manager</option>
                    <option value="Inventory Analyst">Inventory Analyst</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#6e6e73] mb-1">HITL Limit</label>
                  <input 
                    value={limit} 
                    onChange={e => setLimit(e.target.value)} 
                    placeholder="$100,000 USD"
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
