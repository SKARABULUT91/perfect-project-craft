import { useStore } from '@/lib/store';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 70%, 55%)',
];

export default function AnalyticsPage() {
  const { dailyStats, stats } = useStore();

  const pieData = [
    { name: 'Beğeni', value: stats.likes },
    { name: 'Retweet', value: stats.rts },
    { name: 'Takip', value: stats.follows },
    { name: 'T. Bırakma', value: stats.unfollows },
  ].filter((d) => d.value > 0);

  const totalActions = stats.likes + stats.rts + stats.follows + stats.unfollows;
  const avgDaily = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.likes + d.retweets + d.follows, 0) / dailyStats.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Toplam İşlem</div>
          <div className="text-2xl font-bold text-foreground">{totalActions}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Günlük Ortalama</div>
          <div className="text-2xl font-bold text-foreground">{avgDaily}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">En Yoğun Gün</div>
          <div className="text-2xl font-bold text-foreground">
            {dailyStats.length > 0
              ? dailyStats.reduce((max, d) => (d.likes + d.retweets) > (max.likes + max.retweets) ? d : max, dailyStats[0]).date.slice(5)
              : '-'
            }
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Etkileşim Oranı</div>
          <div className="text-2xl font-bold text-primary">{totalActions > 0 ? `${Math.min(100, Math.round((stats.likes / Math.max(1, totalActions)) * 100))}%` : '0%'}</div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">📈 Günlük Etkileşim Trendi</div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 20%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(240, 5%, 65%)' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(240, 5%, 65%)' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(240, 6%, 10%)', border: '1px solid hsl(240, 4%, 16%)', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
              />
              <Area type="monotone" dataKey="likes" name="Beğeni" stackId="1" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
              <Area type="monotone" dataKey="retweets" name="Retweet" stackId="1" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.3} />
              <Area type="monotone" dataKey="comments" name="Yorum" stackId="1" stroke={COLORS[4]} fill={COLORS[4]} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">📊 Takip İstatistikleri</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 20%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(240, 5%, 65%)' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(240, 5%, 65%)' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(240, 6%, 10%)', border: '1px solid hsl(240, 4%, 16%)', borderRadius: '8px', fontSize: 12 }}
                />
                <Bar dataKey="follows" name="Takip" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="unfollows" name="T. Bırakma" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">🎯 İşlem Dağılımı</div>
          <div className="h-[240px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(240, 6%, 10%)', border: '1px solid hsl(240, 4%, 16%)', borderRadius: '8px', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Henüz veri yok</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
