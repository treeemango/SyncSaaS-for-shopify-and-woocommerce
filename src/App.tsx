import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { IntegrationManager } from './components/IntegrationManager'
import { LayoutDashboard, Cable, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import { Auth } from './components/Auth'
import { Landing } from './components/Landing'

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'connect'>('dashboard')
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setAuthLoading(false)
    })

    // Clean up URL parameters (from OAuth/Woo callbacks)
    const url = new URL(window.location.href);
    if (url.searchParams.has('success') || url.searchParams.has('user_id') || url.searchParams.has('code')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return showAuth ? <Auth /> : <Landing onGetStarted={() => setShowAuth(true)} />
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-800 lg:hidden">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="SyncSaaS Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg tracking-tight">SyncSaaS</span>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </header>

      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 p-6 hidden lg:flex lg:flex-col lg:gap-8">
        <div className="flex items-center gap-3 px-2">
          <img src="/favicon.png" alt="SyncSaaS Logo" className="w-10 h-10 rounded-xl" />
          <span className="font-bold text-xl tracking-tight">SyncSaaS</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'connect' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
          >
            <Cable className="w-5 h-5" />
            <span className="font-medium">Integrations</span>
          </button>
        </nav>

        <div className="mt-auto p-4 glass rounded-2xl space-y-3">
          <div>
            <p className="text-xs text-zinc-500">Signed in as</p>
            <p className="text-sm font-medium truncate">{session.user.email}</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg py-2"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        {activeTab === 'dashboard' ? <Dashboard /> : <IntegrationManager />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 p-2 flex gap-2 lg:hidden z-50">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-500'
            }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-xs font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('connect')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${activeTab === 'connect' ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-500'
            }`}
        >
          <Cable className="w-5 h-5" />
          <span className="text-xs font-medium">Connect</span>
        </button>
      </nav>
    </div>
  )
}

export default App
