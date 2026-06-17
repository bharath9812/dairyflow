'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Filter, Calendar, Sun, Moon, Activity, Search, Droplet, Hash, Eye, EyeOff, LayoutTemplate } from 'lucide-react'
import { useState, useEffect, useTransition, useCallback } from 'react'

export default function AdminFilters({ currentYear, isCustomerScope, exportButtons }: { currentYear?: number, isCustomerScope?: boolean, exportButtons?: React.ReactNode }) {
  const displayYear = currentYear || new Date().getFullYear()
  const [isExpanded, setIsExpanded] = useState(true) // Default to true, will override in effect
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  // Initialize and persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('dairyflow_admin_filters_expanded')
    if (saved !== null) {
      setIsExpanded(saved === 'true')
    } else if (isCustomerScope !== undefined) {
      setIsExpanded(!isCustomerScope)
    }
  }, [isCustomerScope])

  const toggleExpanded = () => {
    const next = !isExpanded
    setIsExpanded(next)
    localStorage.setItem('dairyflow_admin_filters_expanded', String(next))
  }

  const [timeframe, setTimeframe] = useState(searchParams.get('timeframe') || 'TODAY')
  const [exactDate, setExactDate] = useState(searchParams.get('exactDate') || '')
  const [exactMonth, setExactMonth] = useState(searchParams.get('exactMonth') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [shift, setShift] = useState(searchParams.get('shift') || 'ALL')
  const [milkType, setMilkType] = useState(searchParams.get('milkType') || 'ALL')
  const [minQty, setMinQty] = useState(searchParams.get('minQty') || '')
  const [qtyOp, setQtyOp] = useState(searchParams.get('qtyOp') || 'gt')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [hideTable, setHideTable] = useState(searchParams.get('hideTable') === 'true')
  const [hiddenCols, setHiddenCols] = useState<string[]>(searchParams.get('hiddenCols') ? (searchParams.get('hiddenCols') as string).split(',') : [])

  // Sync state if search params change externally (back button etc)
  useEffect(() => {
    setTimeframe(searchParams.get('timeframe') || 'TODAY')
    setExactDate(searchParams.get('exactDate') || '')
    setExactMonth(searchParams.get('exactMonth') || '')
    setStartDate(searchParams.get('startDate') || '')
    setEndDate(searchParams.get('endDate') || '')
    setShift(searchParams.get('shift') || 'ALL')
    setMilkType(searchParams.get('milkType') || 'ALL')
    setMinQty(searchParams.get('minQty') || '')
    setQtyOp(searchParams.get('qtyOp') || 'gt')
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  const triggerUpdate = useCallback(() => {
    const params = new URLSearchParams()
    if (timeframe !== 'TODAY') params.set('timeframe', timeframe)
    if (exactDate) params.set('exactDate', exactDate)
    if (exactMonth) params.set('exactMonth', exactMonth)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (shift !== 'ALL') params.set('shift', shift)
    if (milkType !== 'ALL') params.set('milkType', milkType)
    if (minQty) {
      params.set('minQty', minQty)
      params.set('qtyOp', qtyOp)
    }
    if (search) params.set('search', search)
    if (hideTable) params.set('hideTable', 'true')
    if (hiddenCols.length > 0) params.set('hiddenCols', hiddenCols.join(','))
    
    params.set('page', '1') // Reset page on filter change
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [timeframe, exactDate, exactMonth, startDate, endDate, shift, milkType, minQty, qtyOp, search, hideTable, hiddenCols, pathname, router])

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      triggerUpdate()
    }, 500)
    return () => clearTimeout(handler)
  }, [search, triggerUpdate])

  // Persistent Preferences
  useEffect(() => {
    const saved = localStorage.getItem('dairyflow_admin_hidden_cols')
    // Only restore if the URL doesn't already have specific column overrides
    if (saved && !searchParams.get('hiddenCols')) {
      setHiddenCols(saved.split(','))
    }
  }, [])

  useEffect(() => {
    if (hiddenCols.length > 0) {
      localStorage.setItem('dairyflow_admin_hidden_cols', hiddenCols.join(','))
    } else {
      localStorage.removeItem('dairyflow_admin_hidden_cols')
    }
  }, [hiddenCols])

  // Trigger whenever a dropdown changes
  useEffect(() => {
    triggerUpdate()
  }, [timeframe, exactDate, exactMonth, startDate, endDate, shift, milkType, minQty, qtyOp, hideTable, hiddenCols, triggerUpdate])

  const toggleCol = (colKey: string) => {
    setHiddenCols(prev => prev.includes(colKey) ? prev.filter(c => c !== colKey) : [...prev, colKey])
  }

  return (
    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-xl p-5 flex flex-col shrink-0 transition-all duration-300 w-full relative z-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm uppercase tracking-wider">
          <Filter className="w-[18px] h-[18px]" />
          ADVANCED FILTERS
          <button 
            onClick={toggleExpanded}
            className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-slate-100/50 border border-slate-200 text-slate-500 rounded hover:bg-slate-200 transition-colors flex items-center gap-1"
          >
            {isExpanded ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>

        {!isExpanded && exportButtons && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
            {exportButtons}
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 flex flex-col gap-4 mt-4">
          
          <div className="flex flex-wrap gap-4 items-center">
            
            {/* Timeframe Dropdown */}
            <div className="relative input-recessed focus-within:input-recessed-focus flex items-center gap-2 flex-1 min-w-[200px] cursor-pointer">
              <Calendar className="w-5 h-5 text-onyx" />
              <select 
                value={timeframe}
                onChange={(e) => {
                  setTimeframe(e.target.value)
                  if (e.target.value !== 'SPECIFIC_DATE') setExactDate('')
                  if (e.target.value !== 'SPECIFIC_MONTH') setExactMonth('')
                  if (e.target.value !== 'CUSTOM_RANGE') {
                    setStartDate('')
                    setEndDate('')
                  }
                }}
                className="w-full appearance-none bg-transparent text-sm font-medium text-onyx focus:outline-none cursor-pointer"
              >
                <option value="TODAY">Today's Tx</option>
                <option value="SPECIFIC_DATE">Specific Date...</option>
                <option value="SPECIFIC_MONTH">Specific Month...</option>
                <option value="CUSTOM_RANGE">Custom Range...</option>
                <option value="MONTH_FIRST_HALF">1st-15th</option>
                <option value="MONTH_SECOND_HALF">16th-End</option>
                <option value="MONTHLY">Current Month</option>
                <option value="ALL_TIME">All-Time</option>
              </select>
              <div className="pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            {/* Conditional Specific Date/Month Inputs */}
            {timeframe === 'SPECIFIC_DATE' && (
              <div className="relative input-recessed focus-within:input-recessed-focus flex items-center flex-[1_1_160px] animate-in fade-in zoom-in-95 duration-200">
                <input 
                  type="date"
                  value={exactDate}
                  onChange={(e) => setExactDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-onyx focus:outline-none"
                />
              </div>
            )}

            {timeframe === 'SPECIFIC_MONTH' && (
              <div className="relative input-recessed focus-within:input-recessed-focus flex items-center gap-2 flex-[1_1_160px] animate-in fade-in zoom-in-95 duration-200">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select 
                  value={exactMonth}
                  onChange={(e) => setExactMonth(e.target.value)}
                  className="w-full appearance-none bg-transparent text-sm font-medium text-onyx focus:outline-none cursor-pointer"
                >
                  <option value="">Select Month</option>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => {
                    const val = `${displayYear}-${String(i + 1).padStart(2, '0')}`
                    return <option key={val} value={val}>{m}</option>
                  })}
                </select>
                <div className="pointer-events-none text-slate-400 text-xs">▼</div>
              </div>
            )}

            {timeframe === 'CUSTOM_RANGE' && (
              <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative input-recessed focus-within:input-recessed-focus flex items-center">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-sm font-medium text-onyx focus:outline-none"
                  />
                  <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">From</span>
                </div>
                <div className="relative input-recessed focus-within:input-recessed-focus flex items-center">
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-sm font-medium text-onyx focus:outline-none"
                  />
                  <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">To</span>
                </div>
              </div>
            )}

            {/* Shift Dropdown */}
            <div className="relative input-recessed focus-within:input-recessed-focus flex items-center gap-2 flex-[1_1_150px] cursor-pointer">
              <Activity className="w-5 h-5 text-onyx" />
              <select 
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full appearance-none bg-transparent text-sm font-medium text-onyx focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Shifts</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
              <div className="pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            {/* Milk Type Dropdown */}
            <div className="relative input-recessed focus-within:input-recessed-focus flex items-center gap-2 flex-[1_1_180px] cursor-pointer">
              <Droplet className="w-5 h-5 text-sky-accent" />
              <select 
                value={milkType}
                onChange={(e) => setMilkType(e.target.value)}
                className="w-full appearance-none bg-transparent text-sm font-medium text-onyx focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Commodities</option>
                <option value="Cow">🐄 Cow Only</option>
                <option value="Buffalo">🐃 Buffalo Only</option>
              </select>
              <div className="pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

          </div>

          <div className="flex flex-wrap gap-4 items-center">
            
            {/* Quantity Filter */}
            <div className="relative input-recessed focus-within:input-recessed-focus flex items-center gap-2 flex-1 min-w-[150px]">
              <span className="text-sky-accent font-bold text-sm leading-none flex items-center gap-1">
                #
                <select 
                  value={qtyOp}
                  onChange={(e) => setQtyOp(e.target.value)}
                  className="appearance-none bg-transparent text-sm font-black text-sky-accent focus:outline-none cursor-pointer w-6 px-0"
                >
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                  <option value="eq">=</option>
                </select>
              </span>
              <input 
                type="number"
                placeholder="Qty Filter"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                className="border-none bg-transparent outline-none text-sm w-full p-0 text-onyx placeholder:text-slate-400"
              />
            </div>

            {/* Seller Search */}
            {!isCustomerScope && (
              <div className="relative input-recessed focus-within:input-recessed-focus flex items-center gap-2 flex-[2] min-w-[250px]">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by Seller Name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-none bg-transparent outline-none text-sm w-full p-0 text-onyx placeholder:text-slate-400"
                />
              </div>
            )}

            {/* Export Actions are rendered via exportButtons prop within the expanded view on desktop if desired, but we render them at the top right when collapsed. For this design, we will just render them here. */}
            {exportButtons && (
              <div className="flex gap-3 ml-auto">
                {exportButtons}
              </div>
            )}
          </div>

      {/* Table & Column Controls */}
      {/* Table & Column Controls */}
      <div className="flex items-center gap-4 border-t border-slate-200/50 pt-4 mt-2 overflow-x-auto custom-scrollbar pb-1">
        <button 
          onClick={() => setHideTable(!hideTable)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${hideTable ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}
        >
          {hideTable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {hideTable ? 'Table Hidden' : 'Table Visible'}
        </button>

        {!hideTable && (
          <>
            <span className="shrink-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <LayoutTemplate className="w-4 h-4" />
              VISIBLE COLUMNS:
            </span>
            
            <div className="flex items-center gap-2">
              {[
                { key: 'col_sno', label: 'S.No' },
                { key: 'col_tx_id', label: 'Tx ID' },
                { key: 'col_date', label: 'Date/Shift' },
                { key: 'col_seller', label: 'Seller' },
                { key: 'col_type', label: 'Commodity' },
                { key: 'col_volume', label: 'Volume' },
                { key: 'col_capital', label: 'Capital' },
                { key: 'col_audit', label: 'Audit Trail' }
              ].map(col => (
                <button 
                  key={col.key}
                  onClick={() => toggleCol(col.key)}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    hiddenCols.includes(col.key) 
                      ? 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-70' 
                      : 'bg-white text-onyx border-slate-200 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      </div>
      )}

    </div>
  )
}
