import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            Klipei
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-white">
                Entrar
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Começar agora
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Marketing por performance.
            <br />
            <span className="text-emerald-400">Pague apenas por views reais.</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Klipei conecta marcas a clippers que divulgam seu conteúdo e ganham por
            visualização. Você define o orçamento, eles criam os cortes — você só
            paga pelas views que eles geram.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
                Criar campanha
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Sou clipper
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <p className="text-4xl font-bold text-emerald-400 mb-2">R$1-5</p>
            <p className="text-zinc-400">por 1.000 views</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <p className="text-4xl font-bold text-emerald-400 mb-2">0%</p>
            <p className="text-zinc-400">de desperdício</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <p className="text-4xl font-bold text-emerald-400 mb-2">100%</p>
            <p className="text-zinc-400">baseado em resultados</p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-32 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Creators */}
            <div className="p-8 rounded-2xl bg-zinc-800/30 border border-zinc-700">
              <h3 className="text-xl font-semibold text-emerald-400 mb-4">
                Para Criadores / Marcas
              </h3>
              <ol className="space-y-4 text-zinc-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    1
                  </span>
                  <span>Crie uma campanha e defina seu orçamento</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    2
                  </span>
                  <span>Defina quanto paga por 1.000 visualizações</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    3
                  </span>
                  <span>Clippers criam e publicam conteúdo</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    4
                  </span>
                  <span>Você só paga pelas views geradas</span>
                </li>
              </ol>
            </div>

            {/* For Clippers */}
            <div className="p-8 rounded-2xl bg-zinc-800/30 border border-zinc-700">
              <h3 className="text-xl font-semibold text-emerald-400 mb-4">
                Para Clippers
              </h3>
              <ol className="space-y-4 text-zinc-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    1
                  </span>
                  <span>Encontre campanhas que combinam com você</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    2
                  </span>
                  <span>Crie cortes usando o conteúdo disponibilizado</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    3
                  </span>
                  <span>Publique no seu canal e submeta o link</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center">
                    4
                  </span>
                  <span>Ganhe por cada 1.000 views que gerar</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
              Criar conta grátis
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t border-zinc-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500">© 2025 Klipei. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-zinc-500">
            <Link href="#" className="hover:text-zinc-300">
              Termos
            </Link>
            <Link href="#" className="hover:text-zinc-300">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
