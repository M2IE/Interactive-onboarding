import { useMemo, useState } from 'react'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@interactive-onboarding/ui'
import { LayoutGrid, RefreshCw, Search } from 'lucide-react'
import { useJourneyMap } from '@/features/journey-map'
import { JourneyCanvas } from '@/features/journey-map/ui/JourneyCanvas'
import { JourneyDetails } from '@/features/journey-map/ui/JourneyDetails'
import { useLiveSession } from '@/features/live-session'
import { LiveEventFeed, LiveSessionPanel } from '@/features/live-session/ui/LiveSessionPanel'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

export function JourneyStudio() {
  const journey = useJourneyMap()
  const terminalScenarioIds = useMemo(() => {
    if (journey.graph.status !== 'success') return new Set<string>()
    const sources = new Set(journey.graph.data.edges.map((edge) => edge.source))
    return new Set(
      journey.graph.data.nodes
        .filter((node) => node.kind === 'scenario' && !sources.has(node.id))
        .map((node) => node.id),
    )
  }, [journey.graph])
  const live = useLiveSession(terminalScenarioIds)
  const [mobileTab, setMobileTab] = useState('map')
  const [layoutResetKey, setLayoutResetKey] = useState(0)
  const isCompact = useMediaQuery('(max-width: 1180px)')
  const isNarrow = useMediaQuery('(max-width: 600px)')
  const liveEvents = 'events' in live.state ? live.state.events : []
  const currentScenarioId = 'currentScenarioId' in live.state
    ? live.state.currentScenarioId
    : undefined
  const defaultStartUrl = useMemo(() => {
    if (journey.selectedNode?.scenario) return journey.selectedNode.path
    const graph = journey.graph.status === 'success' ? journey.graph.data : undefined
    if (!graph) return undefined
    const firstRoot = graph.nodes.find(
      (node) => node.id === graph.rootIds[0],
    )
    return firstRoot?.path
  }, [journey.graph, journey.selectedNode])

  if (journey.graph.status === 'idle' || journey.graph.status === 'loading') {
    return <section className="editor-state" aria-live="polite"><h2>Строим карту пути</h2><p>Связываем опубликованные сценарии и переходы между ними.</p></section>
  }
  if (journey.graph.status === 'error') {
    return <section className="editor-state editor-state--error" role="alert"><h2>Не удалось загрузить Journey Map</h2><p>{journey.graph.error}</p><Button onClick={journey.refresh}>Повторить</Button></section>
  }
  if (journey.graph.data.nodes.length === 0) {
    return <section className="editor-state"><h2>Нет опубликованных сценариев</h2><p>Опубликуйте хотя бы одну точку входа, чтобы построить карту.</p></section>
  }

  const graph = journey.graph.data
  const map = (
    <div className="journey-map-column">
      <div className="journey-toolbar">
        <label className="journey-search">
          <Search aria-hidden="true" size={17} />
          <span className="visually-hidden">Поиск по карте</span>
          <input
            onChange={(event) => journey.setSearch(event.target.value)}
            placeholder="Найти страницу или сценарий"
            value={journey.search}
          />
        </label>
        <div className="journey-legend" aria-label="Легенда карты">
          <span><i className="is-published" /> Опубликован</span>
          <span><i className="is-warning" /> Разрыв</span>
          <span><i className="is-live" /> Live</span>
        </div>
        <Button
          icon={<LayoutGrid aria-hidden="true" size={16} />}
          onClick={() => setLayoutResetKey((value) => value + 1)}
          size="small"
          variant="ghost"
        >Выровнять</Button>
        <Button icon={<RefreshCw aria-hidden="true" size={16} />} onClick={journey.refresh} size="small" variant="ghost">Обновить</Button>
      </div>
      <JourneyCanvas
        compact={isNarrow}
        currentScenarioId={currentScenarioId}
        graph={graph}
        layoutResetKey={layoutResetKey}
        liveEvents={liveEvents}
        metrics={journey.metrics}
        onSelectNode={journey.selectNode}
        selectedNodeId={journey.selectedNodeId}
        visibleNodeIds={journey.visibleNodeIds}
      />
      <JourneyDetails
        diagnostics={graph.diagnostics}
        onEdit={journey.openSelectedScenario}
        onStart={(url) => { live.start(url); setMobileTab('demo') }}
        selectedNode={journey.selectedNode}
      />
    </div>
  )
  const preview = (
    <LiveSessionPanel
      defaultStartUrl={defaultStartUrl}
      iframeUrl={live.iframeUrl}
      onReady={live.ready}
      onRestart={live.restart}
      onSetViewport={live.setViewport}
      onStart={live.start}
      onStop={live.stop}
      state={live.state}
    />
  )

  if (!isCompact) {
    return <div className="journey-studio journey-studio--desktop">{map}{preview}</div>
  }

  return (
      <Tabs className="journey-studio journey-studio--mobile" onValueChange={setMobileTab} value={mobileTab}>
        <TabsList className="journey-mobile-tabs" aria-label="Разделы Journey Map">
          <TabsTrigger value="map">Карта</TabsTrigger>
          <TabsTrigger value="demo">Демо</TabsTrigger>
          <TabsTrigger value="events">События</TabsTrigger>
        </TabsList>
        <TabsContent value="map">{map}</TabsContent>
        <TabsContent forceMount hidden={mobileTab !== 'demo'} value="demo">{preview}</TabsContent>
        <TabsContent value="events"><div className="journey-mobile-events"><LiveEventFeed events={liveEvents} /></div></TabsContent>
      </Tabs>
  )
}
