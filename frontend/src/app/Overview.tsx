import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar, ReferenceLine } from "recharts";
import { fmt } from "../api"; import { useFilters } from "./state";
import { KPI, Skel, InView, Notices, Empty, Insights, TopMisses, panel, tip, axis, useAnim } from "./ui";

export default function Overview() {
  const { sum, err, rows } = useFilters(); const anim = useAnim(); const m = sum.data?.metrics, c = sum.data?.coverage;
  return <>
    <Notices />
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{sum.loading ? Array.from({ length: 6 }).map((_, i) => <Skel key={i} h="h-32" />) : m && <>
      <KPI label="Mean forecast" value={fmt(m.mean_forecast)} unit="MW" hint="Selected forecast at cutoff" /><KPI label="Mean actual" value={fmt(m.mean_actual)} unit="MW" hint="FUELHH wind, average per half hour" />
      <KPI label="MAE" value={fmt(m.mae)} unit="MW" hint="Average size of the miss" /><KPI label="RMSE" value={fmt(m.rmse)} unit="MW" hint="Weights large misses more" />
      <KPI label="Bias" value={m.bias == null ? "n/a" : (m.bias > 0 ? "+" : "") + fmt(m.bias)} unit="MW" hint={m.bias == null ? "" : m.bias > 0 ? "Forecast ran above actual" : "Forecast ran below actual"} />
      <KPI label="Coverage" value={c ? `${fmt(c.matched)}/${fmt(c.expected_intervals)}` : "n/a"} hint={c ? `${fmt(c.missing_forecast)} actual intervals without an eligible forecast` : ""} /></>}</div>
    <Insights m={m} c={c} />
    <div className={`mt-6 ${panel}`}><h2 className="text-xl font-semibold">Forecast against actual, MW</h2>
      <InView h="mt-4 h-80"><div className="h-full" role="img" aria-label="Line chart of forecast and actual wind generation">{err.loading ? <Skel h="h-full" /> : !rows.length ? <Empty>No matched intervals for this range and cutoff. Try a wider range.</Empty> :
        <ResponsiveContainer><LineChart data={rows}><CartesianGrid stroke="#272727" /><XAxis dataKey="ts" {...axis} minTickGap={48} /><YAxis {...axis} width={48} /><Tooltip {...tip} /><Legend />
          <Line name="Forecast" dataKey="forecast" stroke="#60A5FA" dot={false} strokeWidth={2} {...anim} /><Line name="Actual" dataKey="actual" stroke="#4ADE80" dot={false} strokeWidth={2} {...anim} /></LineChart></ResponsiveContainer>}</div></InView></div>
    <div className={`mt-6 ${panel}`}><h2 className="text-xl font-semibold">Forecast error, MW</h2><p className="mt-1 text-sm text-white/60">Forecast minus actual. Above zero means over forecast, below means under forecast.</p>
      <InView h="mt-4 h-64"><div className="h-full">{err.loading ? <Skel h="h-full" /> : rows.length > 0 && <ResponsiveContainer><BarChart data={rows} stackOffset="sign"><CartesianGrid stroke="#272727" /><XAxis dataKey="ts" {...axis} minTickGap={48} /><YAxis {...axis} width={48} /><Tooltip {...tip} /><ReferenceLine y={0} stroke="#9B9B9B" />
        <Bar name="Over forecast" dataKey="over" stackId="e" fill="#FB923C" {...anim} /><Bar name="Under forecast" dataKey="under" stackId="e" fill="#F87171" {...anim} /></BarChart></ResponsiveContainer>}</div></InView></div>
    <TopMisses rows={rows} />
  </>;
}
