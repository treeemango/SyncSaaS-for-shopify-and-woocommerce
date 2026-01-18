import React from 'react';
import { ShoppingBag, Globe, Zap, ShieldCheck, ArrowRight, BarChart3, Clock, LayoutDashboard } from 'lucide-react';

interface LandingProps {
    onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-blue-500/30">
            {/* Navigation */}
            <nav className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/favicon.png" alt="SyncSaaS Logo" className="w-10 h-10 rounded-xl" />
                        <span className="font-bold text-2xl tracking-tighter">SyncSaaS</span>
                    </div>
                    <button
                        onClick={onGetStarted}
                        className="bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-white transition-all active:scale-95 shadow-xl shadow-white/5"
                    >
                        Launch App
                    </button>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 pb-32 overflow-hidden">
                    {/* Background Blobs */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(circle_at_top_right,_#1e3a8a_0%,_transparent_40%),_radial-gradient(circle_at_top_left,_#581c87_0%,_transparent_40%)] opacity-30" />

                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <Zap className="w-3 h-3 fill-current" />
                            <span>Scale your e-commerce business faster</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            Sync your stores. <br />
                            <span className="gradient-text">Dominate your data.</span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                            The ultimate multi-channel dashboard for Shopify and WooCommerce sellers.
                            Real-time synchronization, unified analytics, and executive oversight—synchronized everywhere.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-2xl shadow-blue-500/20 hover:-translate-y-1 active:scale-95"
                            >
                                Get Started for Free
                                <ArrowRight className="w-6 h-6" />
                            </button>
                            <button
                                className="w-full sm:w-auto border border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 backdrop-blur-md px-10 py-5 rounded-2xl font-bold text-lg transition-all active:scale-95"
                            >
                                Watch Demo
                            </button>
                        </div>

                        {/* Mockup Preview */}
                        <div className="mt-24 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] opacity-20 blur-3xl" />
                            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-800/50 group">
                                <img
                                    src="/dashboard-mockup.png"
                                    alt="SyncSaaS Dashboard Mockup"
                                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-transparent transition-colors pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-32 relative border-t border-zinc-800/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">Native Integrations</h2>
                            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                                Connect your existing infrastructure in seconds. No complex API management required.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                            {/* Shopify */}
                            <div className="glass group p-10 rounded-[2.5rem] border border-zinc-800 hover:border-blue-500/30 transition-all">
                                <div className="w-16 h-16 bg-[#95bf47]/10 flex items-center justify-center rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <ShoppingBag className="w-8 h-8 text-[#95bf47]" />
                                </div>
                                <h3 className="text-3xl font-bold mb-4">Shopify</h3>
                                <p className="text-zinc-400 leading-relaxed mb-6">
                                    Official Shopify OAuth 2.0 integration. Sync orders, customer profiles, and product trends with zero latency.
                                </p>
                                <div className="flex items-center gap-2 text-[#95bf47] font-bold">
                                    <span>Learn more</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>

                            {/* WooCommerce */}
                            <div className="glass group p-10 rounded-[2.5rem] border border-zinc-800 hover:border-purple-500/30 transition-all">
                                <div className="w-16 h-16 bg-[#96588a]/10 flex items-center justify-center rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <Globe className="w-8 h-8 text-[#96588a]" />
                                </div>
                                <h3 className="text-3xl font-bold mb-4">WooCommerce</h3>
                                <p className="text-zinc-400 leading-relaxed mb-6">
                                    Enterprise-grade WordPress authentication. Supports multi-site networks and custom order fields natively.
                                </p>
                                <div className="flex items-center gap-2 text-[#96588a] font-bold">
                                    <span>Learn more</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Trust Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center border-t border-zinc-800 px-6 py-12 bg-zinc-900/20 rounded-[2.5rem]">
                            <div className="space-y-4">
                                <BarChart3 className="w-8 h-8 text-blue-500 mx-auto" />
                                <h4 className="font-bold">Real-time Analytics</h4>
                                <p className="text-xs text-zinc-500">Live data streaming across every connected store.</p>
                            </div>
                            <div className="space-y-4">
                                <ShieldCheck className="w-8 h-8 text-green-500 mx-auto" />
                                <h4 className="font-bold">Encrypted OAuth</h4>
                                <p className="text-xs text-zinc-500">Your credentials never touch our local database.</p>
                            </div>
                            <div className="space-y-4">
                                <Clock className="w-8 h-8 text-orange-500 mx-auto" />
                                <h4 className="font-bold">15min Auto-Sync</h4>
                                <p className="text-xs text-zinc-500">Stay up to date with automated background syncing.</p>
                            </div>
                            <div className="space-y-4">
                                <LayoutDashboard className="w-8 h-8 text-purple-500 mx-auto" />
                                <h4 className="font-bold">Unified Feed</h4>
                                <p className="text-xs text-zinc-500">Every order, from every store, in one clean feed.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 px-6">
                    <div className="max-w-5xl mx-auto rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center bg-zinc-900 shadow-2xl border border-zinc-800">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] -z-0" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[100px] -z-0" />

                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 relative z-10 tracking-tight">
                            Ready to unify your business?
                        </h2>
                        <p className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto relative z-10 leading-relaxed">
                            Join hundreds of high-volume sellers managing their stores through SyncSaaS. Free to get started, premium for eternity.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-12 py-6 rounded-2xl font-black text-xl transition-all shadow-2xl shadow-blue-500/40 relative z-10 hover:scale-105 active:scale-95"
                        >
                            Get Started Now
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800/50 py-12 bg-zinc-950/50">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <img src="/favicon.png" alt="SyncSaaS Logo" className="w-8 h-8 grayscale opacity-50" />
                        <span className="font-bold text-lg text-zinc-500">SyncSaaS</span>
                    </div>
                    <div className="flex gap-8 text-zinc-600 text-sm font-medium">
                        <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
                        <a href="#" className="hover:text-zinc-300 transition-colors">Contact</a>
                    </div>
                    <p className="text-zinc-700 text-xs">© 2026 SyncSaaS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};
