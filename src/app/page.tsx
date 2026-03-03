import Link from "next/link";
import { ArrowRight, MapPin, Calendar, Users, Star, Globe2 } from "lucide-react";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-primary/30 overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 z-0 flex justify-center pointer-events-none">
        <div className="absolute -top-[20%] w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute top-[30%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[100px] mix-blend-screen opacity-40" />
        <div className="absolute bottom-[-10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen opacity-30" />
        <div className="absolute inset-0 bg-transparent bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <Globe2 className="h-7 w-7 text-primary" />
            <span>Next<span className="text-primary italic">Trip</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors block md:hidden">
              Entrar
            </Link>
            <Link href="/login" className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Fazer login
            </Link>
            <Link href="/register" className="text-sm font-medium bg-zinc-100 text-zinc-900 px-5 py-2.5 rounded-full hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5">
              Criar Conta
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-6 pt-20 pb-16 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-in fade-in zoom-in duration-700 delay-100">
            <Star className="h-4 w-4" />
            <span>Revolucionando o Turismo Moderno</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 leading-[1.1]">
            Planeje roteiros de forma <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-blue-400">
              excepcionalmente inteligente
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            A conexão perfeita entre agências e turistas. Crie cronogramas impecáveis, gerencie custos e ofereça experiências inesquecíveis com um painel de colaboração em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in zoom-in duration-700 delay-400">
            <Link href="/register" className="group flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary/90 hover:shadow-[0_0_30px_-5px] hover:shadow-primary/40 transition-all w-full sm:w-auto">
              Começar Agora
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-lg border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 transition-all w-full sm:w-auto backdrop-blur-sm">
              Já tenho uma conta
            </Link>
          </div>
        </main>

        {/* Features Preview */}
        <section className="container mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/80 transition-all hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-100">Inteligência Logística</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">Mapas integrados e gestão de paradas avançada. Otimize rotas com a nossa visualização de linha do tempo.</p>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/80 transition-all hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-100">Multi-Clientes N:N</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">Conecte dezenas de turistas a um único pacote. Gerencie perfis, fotos e comunicação num só lugar.</p>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/80 transition-all hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-100">Controle Total</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">Controle financeiro, feedbacks de clientes via painel de sugestões e status de aprovação de roteiros.</p>
            </div>
          </div>
        </section>

        {/* Dashboard Mockup Showcase */}
        <section className="container mx-auto px-6 pb-32 animate-in fade-in slide-in-from-bottom-24 duration-1000 delay-700">
          <div className="relative max-w-5xl mx-auto rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-indigo-500/30 to-blue-500/30 blur-2xl opacity-20" />
            <div className="rounded-lg border border-zinc-800 bg-black overflow-hidden relative">
              <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors"></div>
                  <div className="h-3 w-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors"></div>
                  <div className="h-3 w-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors"></div>
                </div>
                <div className="mx-auto flex-1 text-center text-xs text-zinc-500 font-mono flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1 rounded-md">
                    nexttrip.app/dashboard
                  </div>
                </div>
              </div>
              <div className="aspect-[16/9] md:aspect-[21/9] w-full bg-[url('https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-60 relative group">
                <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-transparent transition-colors duration-700" />
                {/* Fake UI Overlay to make it look like a real app */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 flex flex-col justify-end p-4 md:p-8">
                  <div className="p-4 md:p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md max-w-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                        <MapPin className="text-primary w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm md:text-base">Roteiro Europa Premium</h4>
                        <p className="text-zinc-400 text-xs md:text-sm">Paris, Roma, Lisboa</p>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[75%]"></div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 text-right">Em andamento</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 py-12 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} NextTrip Inc. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
