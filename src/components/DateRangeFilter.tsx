'use client'

import React from 'react'
import { Calendar } from 'lucide-react'

export type DateFilterMode = 'TODAY' | 'RANGE' | 'ALL'

interface DateRangeFilterProps {
  mode: DateFilterMode
  startDate: string
  endDate: string
  onModeChange: (mode: DateFilterMode) => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  todayCount?: number
  totalCount?: number
  className?: string
}

export default function DateRangeFilter({
  mode,
  startDate,
  endDate,
  onModeChange,
  onStartDateChange,
  onEndDateChange,
  todayCount,
  totalCount,
  className = '',
}: DateRangeFilterProps) {
  const todayStr = new Date().toISOString().split('T')[0]

  const handleQuickPreset = (preset: '7days' | 'month') => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    onEndDateChange(today)
    if (preset === '7days') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
      onStartDateChange(past.toISOString().split('T')[0])
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      onStartDateChange(firstDay.toISOString().split('T')[0])
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="inline-flex items-center p-1 bg-slate-200/70 rounded-xl border border-slate-300 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            onModeChange('TODAY')
            onStartDateChange(todayStr)
            onEndDateChange(todayStr)
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            mode === 'TODAY'
              ? 'bg-amber-700 text-white shadow-xs font-extrabold'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Today</span>
          {todayCount !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                mode === 'TODAY' ? 'bg-amber-900 text-amber-100' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {todayCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onModeChange('RANGE')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            mode === 'RANGE'
              ? 'bg-amber-700 text-white shadow-xs font-extrabold'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Date Range</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('ALL')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            mode === 'ALL'
              ? 'bg-amber-700 text-white shadow-xs font-extrabold'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <span>All Entries</span>
          {totalCount !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                mode === 'ALL' ? 'bg-amber-900 text-amber-100' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {totalCount}
            </span>
          )}
        </button>
      </div>

      {mode === 'RANGE' && (
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 bg-amber-50/80 border border-amber-300 p-1.5 rounded-xl text-xs w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-1">
            <span className="font-bold text-amber-900 pl-1">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-2 py-1 border border-amber-400 bg-white font-mono font-bold rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-1">
            <span className="font-bold text-amber-900">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-2 py-1 border border-amber-400 bg-white font-mono font-bold rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            />
          </div>
          <div className="flex items-center justify-end gap-1 border-t sm:border-t-0 sm:border-l border-amber-300 pt-1 sm:pt-0 sm:pl-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('7days')}
              className="px-2 py-1 text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-md transition-colors"
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset('month')}
              className="px-2 py-1 text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-md transition-colors"
            >
              This Month
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function filterRecordsByDate<T>(
  records: T[],
  getDateFn: (record: T) => string,
  mode: DateFilterMode,
  startDate: string,
  endDate: string
): T[] {
  const todayStr = new Date().toISOString().split('T')[0]
  return records.filter((r) => {
    const rawDate = getDateFn(r)
    const cleanDate = rawDate ? rawDate.split('T')[0] : ''
    if (mode === 'TODAY') {
      return cleanDate === todayStr
    }
    if (mode === 'RANGE') {
      if (startDate && endDate) {
        return cleanDate >= startDate && cleanDate <= endDate
      } else if (startDate) {
        return cleanDate >= startDate
      } else if (endDate) {
        return cleanDate <= endDate
      }
    }
    return true
  })
}
