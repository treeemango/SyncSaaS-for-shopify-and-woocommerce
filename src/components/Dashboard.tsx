import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    ShoppingCart, Users, DollarSign,
    ArrowUpRight, ArrowDownRight, RefreshCw, ShoppingBag, Cable, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [stats, setStats] = useState({
        totalSales: 0,
        orderCount: 0,
        customerCount: 0,
        growth: 0,
        profit: 0,
        customerGrowth: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch integrations with more metadata
            const { data: ints, error: intError } = await supabase
                .from('integrations')
                .select('id, platform, store_url, status, last_sync_at')
                .order('created_at', { ascending: false });

            if (intError) throw intError;
            setIntegrations(ints || []);

            // Fetch orders
            const { data: ords, error: ordError } = await supabase
                .from('orders')
                .select('id, integration_id, external_id, total_price, currency, customer_name, status, ordered_at')
                .order('ordered_at', { ascending: false })
                .limit(50);

            if (ordError) throw ordError;
            const fetchedOrders = ords || [];
            setOrders(fetchedOrders);

            // Calculate dynamic stats
            const total = fetchedOrders.reduce((acc, curr) => acc + Number(curr.total_price), 0);
            const customers = new Set(fetchedOrders.map(o => o.customer_name)).size;

            // Simple dynamic growth simulation
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const prev24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

            // Orders growth
            const ordersLast24h = fetchedOrders.filter(o => new Date(o.ordered_at) > last24h).length;
            const ordersPrev24h = fetchedOrders.filter(o => new Date(o.ordered_at) > prev24h && new Date(o.ordered_at) <= last24h).length;
            const salesGrowth = ordersPrev24h > 0 ? ((ordersLast24h - ordersPrev24h) / ordersPrev24h) * 100 : (ordersLast24h > 0 ? 100 : 0);

            // Customers growth
            const customersLast24h = new Set(fetchedOrders.filter(o => new Date(o.ordered_at) > last24h).map(o => o.customer_name)).size;
            const customersPrev24h = new Set(fetchedOrders.filter(o => new Date(o.ordered_at) > prev24h && new Date(o.ordered_at) <= last24h).map(o => o.customer_name)).size;
            const customerGrowth = customersPrev24h > 0 ? ((customersLast24h - customersPrev24h) / customersPrev24h) * 100 : (customersLast24h > 0 ? 100 : 0);

            setStats({
                totalSales: total,
                orderCount: fetchedOrders.length,
                customerCount: customers,
                growth: Math.round(salesGrowth),
                profit: total * 0.35, // Simulation: 35% margin
                customerGrowth: Math.round(customerGrowth)
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAll = async (targetIntegrations?: any[]) => {
        const intsToSync = targetIntegrations || integrations;
        if (syncing || intsToSync.length === 0) return;

        setSyncing(true);
        try {
            const activeInts = intsToSync.filter(i => i.status === 'active');
            if (activeInts.length === 0) return;

            // Parallel sync: trigger all at once
            await Promise.all(activeInts.map(integration =>
                supabase.functions.invoke('sync-data', {
                    body: { integration_id: integration.id }
                })
            ));
            await fetchData();
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setSyncing(false);
        }
    };    // Auto-sync detector
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true' && integrations.length > 0 && !syncing) {
            handleSyncAll(integrations);
        }
    }, [integrations]);

    // Aggregate sales data by date across all stores
    const getChartData = () => {
        const dailyData: Record<string, number> = {};

        // Take a larger set to have a meaningful timeline
        orders.forEach(o => {
            const date = new Date(o.ordered_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            dailyData[date] = (dailyData[date] || 0) + Number(o.total_price);
        });

        // Convert back to array and sort by date (reverse for chronological)
        return Object.entries(dailyData)
            .map(([name, sales]) => ({ name, sales }))
            .reverse() // Orders were fetched descending
            .slice(-14); // Last 14 days of activity
    };

    const chartData = getChartData();

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold gradient-text tracking-tight">Executive Overview</h1>
                    <p className="text-zinc-400 mt-2 text-lg">Managing {integrations.filter(i => i.status === 'active').length} active external channels.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleSyncAll()}
                        disabled={syncing}
                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 ${syncing ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-950 animate-pulse' : ''}`}
                    >
                        <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                        <span>{syncing ? 'Auto-Syncing Data...' : 'Force Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Gross Sales"
                    value={`$${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-5 h-5 text-blue-400" />}
                    change={`${stats.growth}%`}
                    positive={stats.growth >= 0}
                />
                <StatCard
                    title="Estimated Profit"
                    value={`$${stats.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={<ShoppingCart className="w-5 h-5 text-purple-400" />}
                    change={`${stats.growth >= 0 ? '+' : ''}${stats.growth}%`}
                    positive={stats.growth >= 0}
                />
                <StatCard
                    title="Orders Synced"
                    value={stats.orderCount.toString()}
                    icon={<ShoppingBag className="w-5 h-5 text-green-400" />}
                    change={`+${orders.filter(o => new Date(o.ordered_at) > new Date(Date.now() - 3600000)).length} new`}
                    positive={true}
                />
                <StatCard
                    title="Total Customers"
                    value={stats.customerCount.toString()}
                    icon={<Users className="w-5 h-5 text-orange-400" />}
                    change={`${stats.customerGrowth >= 0 ? '+' : ''}${stats.customerGrowth}%`}
                    positive={stats.customerGrowth >= 0}
                />
            </div>

            {/* Connected Channels (Multi-Store Visibility) */}
            <section>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Cable className="w-5 h-5 text-blue-500" />
                    Connected Channels
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.length > 0 ? integrations.map((int, idx) => (
                        <div key={`${int.id}-${idx}`} className="glass p-5 rounded-2xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-all group">
                            <div className={`p-3 rounded-xl ${int.platform === 'shopify' ? 'bg-[#95bf47]/10 text-[#95bf47]' : 'bg-[#96588a]/10 text-[#96588a]'}`}>
                                {int.platform === 'shopify' ? <ShoppingBag className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold capitalize">{int.platform}</h4>
                                <p className="text-xs text-zinc-500 truncate">{int.store_url}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${int.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {int.status.toUpperCase()}
                                </span>
                                <p className="text-[10px] text-zinc-600 mt-1">
                                    {int.last_sync_at ? `Synced ${new Date(int.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Never synced'}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="lg:col-span-3 glass p-10 rounded-3xl border-dashed border-2 border-zinc-800 text-center">
                            <p className="text-zinc-500 mb-4">No stores connected yet.</p>
                            <button className="text-blue-400 font-bold hover:text-blue-300">Add your first integration →</button>
                        </div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 glass p-8 rounded-3xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold">Sales Trajectory</h3>
                            <p className="text-xs text-zinc-500 mt-1">Revenue performance over recent timeline.</p>
                        </div>
                    </div>
                    <div className="h-64 sm:h-80 w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e21" />
                                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={45} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#09090b' }}
                                        activeDot={{ r: 5, fill: '#fff', strokeWidth: 0 }}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-500 italic">
                                Waiting for data from connected channels...
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="glass p-8 rounded-3xl border border-zinc-800">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold">Recent Feed</h3>
                        <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">LIVE</span>
                    </div>
                    <div className="space-y-4 max-h-[480px] overflow-auto pr-3 custom-scrollbar">
                        {orders.length > 0 ? orders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 hover:border-blue-500/30 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-bold text-sm text-blue-400 shadow-inner">
                                        {order.customer_name ? order.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                    </div>
                                    <div className="max-w-36">
                                        <h4 className="text-sm font-bold truncate text-zinc-100">{order.customer_name || 'Guest User'}</h4>
                                        <p className="text-[10px] text-zinc-500 font-medium">{new Date(order.ordered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.external_id.split('-').pop()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black tracking-tight">{order.currency} {Number(order.total_price).toFixed(2)}</p>
                                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg inline-block mt-1 ${order.status === 'paid' || order.status === 'completed' || order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                        order.status === 'pending' || order.status === 'processing' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20">
                                <ShoppingBag className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-600 text-sm italic">Feed is empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, change, positive }: any) => (
    <div className="glass p-6 rounded-2xl hover:border-zinc-500 transition-all group">
        <div className="flex justify-between items-start">
            <div className="p-2 rounded-lg bg-zinc-800 overflow-hidden group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className={`flex items-center text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
                {positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {change}
            </div>
        </div>
        <div className="mt-4">
            <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
            <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
        </div>
    </div>
);
