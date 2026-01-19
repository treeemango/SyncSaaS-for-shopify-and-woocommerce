import React, { useState } from 'react';
import { ShoppingBag, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const platforms = [
    {
        id: 'shopify',
        name: 'Shopify',
        icon: <ShoppingBag className="w-8 h-8 text-[#95bf47]" />,
        description: 'Connect your Shopify store using OAuth 2.0. We will sync your orders and sales data automatically.',
        color: '#95bf47'
    },
    {
        id: 'woocommerce',
        name: 'WooCommerce',
        icon: <Globe className="w-8 h-8 text-[#96588a]" />,
        description: 'Connect your WordPress store via official Web Auth. No manual API keys required.',
        color: '#96588a'
    }
];

export const IntegrationManager: React.FC = () => {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const [storeUrl, setStoreUrl] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const normalizeShopifyShop = (input: string) => {
        const trimmed = input.trim()
        if (!trimmed) return ''

        try {
            const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)

            // admin.shopify.com/store/<slug>/... -> <slug>.myshopify.com
            if (url.hostname === 'admin.shopify.com') {
                const parts = url.pathname.split('/').filter(Boolean)
                const storeIndex = parts.findIndex(p => p === 'store')
                if (storeIndex >= 0 && parts.length > storeIndex + 1) {
                    const slug = parts[storeIndex + 1]
                    return `${slug}.myshopify.com`
                }
            }

            return url.hostname.replace(/^www\./, '')
        } catch {
            return trimmed.replace(/^https?:\/\//, '').replace(/\/.+$/, '')
        }
    }

    const isValidShopifyDomain = (host: string) => host.endsWith('.myshopify.com')

    const handleConnect = async () => {
        if (!storeUrl) return;
        setConnecting(true);
        setErrorMessage(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Please sign in to connect a store.');

            const platformPath = selectedPlatform === 'shopify' ? 'shopify-auth/install' : 'woo-auth/initiate';
            const paramName = selectedPlatform === 'shopify' ? 'shop' : 'store_url';

            let normalizedStoreUrl = storeUrl
            if (selectedPlatform === 'shopify') {
                const host = normalizeShopifyShop(storeUrl)
                if (!isValidShopifyDomain(host)) {
                    throw new Error('Please enter your Shopify domain like mystore.myshopify.com (not an admin URL).')
                }
                normalizedStoreUrl = host
            } else {
                // WooCommerce: ensure https:// protocol
                normalizedStoreUrl = storeUrl.trim()
                if (!normalizedStoreUrl.startsWith('http://') && !normalizedStoreUrl.startsWith('https://')) {
                    normalizedStoreUrl = `https://${normalizedStoreUrl}`
                }
                // Remove trailing slash
                normalizedStoreUrl = normalizedStoreUrl.replace(/\/+$/, '')
            }

            // Call the initiation function which returns the redirect URL
            const { data, error } = await supabase.functions.invoke(`${platformPath}?${paramName}=${encodeURIComponent(normalizedStoreUrl)}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) {
                // Supabase functions errors often expose message/context differently depending on the failure mode.
                const msg = (error as any)?.context?.error || (error as any)?.message || 'Failed to initiate connection.'
                throw new Error(msg)
            }

            if (data?.error) {
                throw new Error(data.error)
            }

            if (data?.url) {
                // Redirect user to the platform's authorization page
                window.location.href = data.url;
            } else {
                throw new Error('Failed to get authorization URL');
            }
        } catch (error) {
            console.error('Connection error:', error);
            setErrorMessage((error as any)?.message || 'Failed to initiate connection.');
            setConnecting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight mb-4">Connect Your Store</h1>
                <p className="text-zinc-400 text-lg">Select a platform below to start syncing your business data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {platforms.map((p) => (
                    <div
                        key={p.id}
                        onClick={() => setSelectedPlatform(p.id)}
                        className={`glass p-8 rounded-3xl cursor-pointer transition-all border-2 ${selectedPlatform === p.id ? 'border-blue-500 scale-[1.02]' : 'border-transparent hover:border-zinc-700'
                            }`}
                    >
                        <div className="mb-6">{p.icon}</div>
                        <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">{p.description}</p>
                    </div>
                ))}
            </div>

            {selectedPlatform && (
                <div className="glass p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h4 className="text-lg font-semibold mb-4">
                        Enter your {selectedPlatform === 'shopify' ? 'Shopify' : 'WooCommerce'} URL
                    </h4>
                    {errorMessage && (
                        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {errorMessage}
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder={selectedPlatform === 'shopify' ? 'mystore.myshopify.com' : 'https://mystore.com'}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                            value={storeUrl}
                            onChange={(e) => {
                                setStoreUrl(e.target.value)
                                if (errorMessage) setErrorMessage(null)
                            }}
                        />
                        <button
                            disabled={connecting || !storeUrl}
                            onClick={handleConnect}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {connecting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Connect Now
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                    <p className="mt-4 text-xs text-zinc-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Your data is encrypted and synced every 15 minutes.
                    </p>
                </div>
            )}
        </div>
    );
};
