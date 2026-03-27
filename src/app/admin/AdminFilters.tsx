'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Calendar, Sun, Moon, Activity, Search, Droplet, Hash, X, Eye, EyeOff, LayoutTemplate } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AdminFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [timeframe, setTimeframe] = useState(searchParams.get('timeframe') || 'TODAY')
  const [exactDate, setExactDate] = useState(searchParams.get('exactDate') || '')
  const [exactMonth, setExactMonth] = useState(searchParams.get('exactMonth') || '')
  const [shift, setShift] = useState(searchParams.get('shift') || 'ALL')
  const [milkType, setMilkType] = useState(searchParams.get('milkType') || 'ALL')
  const [minQty, setMinQty] = useState(searchParams.get('minQty') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [hideTable, setHideTable] = useState(searchParams.get('hideTable') === 'true')
  const [hiddenCols, setHiddenCols] = useState<string[]>(searchParams.get('hiddenCols') ? (searchParams.get('hiddenCols') as string).split(',') : [])

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      triggerUpdate()
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const triggerUpdate = () => {
    const params = new URLSearchParams()
    if (timeframe !== 'TODAY') params.set('timeframe', timeframe)
    if (exactDate) params.set('exactDate', exactDate)
    if (exactMonth) params.set('exactMonth', exactMonth)
    if (shift !== 'ALL') params.set('shift', shift)
    if (milkType !== 'ALL') params.set('milkType', milkType)
    if (minQty) params.set('minQty', minQty)
    if (search) params.set('search', search)
    if (hideTable) params.set('hideTable', 'true')
    if (hiddenCols.length > 0) params.set('hiddenCols', hiddenCols.join(','))
    
    params.set('page', '1') // Reset page on filter change
    router.push(`/admin?${params.toString()}`)
  }

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
  }, [timeframe, exactDate, exactMonth, shift, milkType, minQty, hideTable, hiddenCols])

  const toggleCol = (colKey: string) => {
    setHiddenCols(prev => prev.includes(colKey) ? prev.filter(c => c !== colKey) : [...prev, colKey])
  }

  return (
    <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 w-full">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Filter className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Advanced Filters</h3>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Timeframe Dropdown */}
        <div className="relative flex-[1_1_180px]">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
          <select 
            value={timeframe}
            onChange={(e) => {
              setTimeframe(e.target.value)
              if (e.target.value !== 'SPECIFIC_DATE') setExactDate('')
              if (e.target.value !== 'SPECIFIC_MONTH') setExactMonth('')
            }}
            className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all hover:bg-slate-100"
          >
            <option value="TODAY">Today's Tx</option>
            <option value="SPECIFIC_DATE">Specific Date...</option>
            <option value="SPECIFIC_MONTH">Specific Month...</option>
            <option value="MONTH_FIRST_HALF">1st-15th</option>
            <option value="MONTH_SECOND_HALF">16th-End</option>
            <option value="MONTHLY">Current Month</option>
            <option value="ALL_TIME">All-Time</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Conditional Specific Date/Month Inputs */}
        {timeframe === 'SPECIFIC_DATE' && (
          <div className="relative flex-[1_1_160px] animate-in fade-in zoom-in-95 duration-200">
            <input 
              type="date"
              value={exactDate}
              onChange={(e) => setExactDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        )}

        {timeframe === 'SPECIFIC_MONTH' && (
          <div className="relative flex-[1_1_160px] animate-in fade-in zoom-in-95 duration-200">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={exactMonth}
              onChange={(e) => setExactMonth(e.target.value)}
              className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
            >
              <option value="">Select Month</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => {
                const val = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`
                return <option key={val} value={val}>{m}</option>
              })}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>
        )}

        {/* Shift Dropdown */}
        <div className="relative flex-[1_1_150px]">
          {shift === 'Morning' ? <Sun className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" /> :
           shift === 'Evening' ? <Moon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" /> :
           <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
          <select 
            value={shift}
            onChange={(e) => setShift(e.target.value)}
            className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all hover:bg-slate-100"
          >
            <option value="ALL">All Shifts</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Milk Type Dropdown */}
        <div className="relative flex-[1_1_180px]">
          <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
          <select 
            value={milkType}
            onChange={(e) => setMilkType(e.target.value)}
            className="w-full appearance-none pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all hover:bg-slate-100"
          >
            <option value="ALL">All Commodities</option>
            <option value="Cow">🐄 Cow Only</option>
            <option value="Buffalo">🐃 Buffalo Only</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
        </div>

        {/* Min Quantity */}
        <div className="relative flex-[1_1_160px]">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <input 
            type="number"
            placeholder="Min Litres"
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>

        {/* Seller Search */}
        <div className="relative flex-[2_1_250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search Seller ID/Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Table & Column Controls */}
      <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-slate-100">
        <button 
          onClick={() => setHideTable(!hideTable)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${hideTable ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
        >
          {hideTable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {hideTable ? 'Table Hidden' : 'Table Visible'}
        </button>

        {!hideTable && (
          <>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Visible Columns:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
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
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
                    hiddenCols.includes(col.key) 
                      ? 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-70' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm'
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
  )
}
