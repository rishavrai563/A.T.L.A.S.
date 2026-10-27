import { useEffect, useRef } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { observeTheme } from '../motion/motionPrefs'

// lightweight-charts needs concrete colors, so resolve the CSS design tokens.
function readTokens() {
  const css = getComputedStyle(document.documentElement)
  const token = (name) => css.getPropertyValue(name).trim()
  return {
    text: token('--muted'),
    grid: token('--grid'),
    border: token('--border-strong'),
    gain: token('--gain'),
    loss: token('--loss'),
    label: token('--surface-solid'),
    font: token('--font-sans'),
  }
}

function chartOptions(t) {
  return {
    layout: {
      background: { type: 'solid', color: 'transparent' },
      textColor: t.text,
      fontFamily: t.font,
      fontSize: 11,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { color: t.grid, style: LineStyle.Dashed },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: t.border, style: LineStyle.Dashed, labelBackgroundColor: t.label },
      horzLine: { color: t.border, style: LineStyle.Dashed, labelBackgroundColor: t.label },
    },
    rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
    timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
  }
}

function buildMarkers(trades, t) {
  if (!trades?.length) return []
  return trades.map((trade) => {
    const isBuy = trade.direction === 'Buy'
    return {
      time: Math.floor(new Date(trade.time).getTime() / 1000),
      position: isBuy ? 'belowBar' : 'aboveBar',
      color: isBuy ? t.gain : t.loss,
      shape: isBuy ? 'arrowUp' : 'arrowDown',
      text: isBuy ? 'BUY' : 'SELL',
      size: 1,
      trade, // original trade for click handling
    }
  }).sort((a, b) => a.time - b.time)
}

export default function CandlestickChart({ data, trades, onTradeClick, height = 400 }) {
  const chartContainerRef = useRef()

  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return undefined

    let tokens = readTokens()
    const chart = createChart(container, { ...chartOptions(tokens), width: container.clientWidth, height })

    const candleSeries = chart.addCandlestickSeries({
      upColor: tokens.gain,
      downColor: tokens.loss,
      wickUpColor: tokens.gain,
      wickDownColor: tokens.loss,
      borderVisible: false,
      priceLineVisible: false,
    })

    // Remove duplicates from data and sort
    const uniqueData = data
      .filter((v, i, a) => a.findIndex(t => t.time === v.time) === i)
      .sort((a, b) => a.time - b.time)
    candleSeries.setData(uniqueData)

    let markers = buildMarkers(trades, tokens)
    const applyMarkers = () => {
      try {
        candleSeries.setMarkers(markers)
      } catch (e) {
        console.warn('Could not set all markers, some times may be outside data range or duplicated:', e)
      }
    }
    applyMarkers()
    chart.timeScale().fitContent()

    // Handle clicks for trade markers
    if (onTradeClick) {
      chart.subscribeClick((param) => {
        if (!param.point || !param.time) return
        const clickedMarker = markers.find(m => m.time === param.time)
        onTradeClick(clickedMarker?.trade ?? null) // clear selection if clicked elsewhere
      })
    }

    // Re-color when the theme toggles
    const stopThemeWatch = observeTheme(() => {
      tokens = readTokens()
      chart.applyOptions(chartOptions(tokens))
      candleSeries.applyOptions({ upColor: tokens.gain, downColor: tokens.loss, wickUpColor: tokens.gain, wickDownColor: tokens.loss })
      markers = buildMarkers(trades, tokens)
      applyMarkers()
    })

    const resizeObserver = new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth }))
    resizeObserver.observe(container)

    return () => {
      stopThemeWatch()
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [data, trades, height, onTradeClick])

  return <div ref={chartContainerRef} className="price-chart" style={{ width: '100%', height: `${height}px` }} />
}
