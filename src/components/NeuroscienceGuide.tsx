import React from 'react';
import {
  Brain,
  Zap,
  Sparkles,
  Flame,
  Layers,
  Target,
  CheckCircle2,
  XCircle,
  Activity,
  Award,
  BookOpen
} from 'lucide-react';
import { NEUROSCIENCE_PILLARS } from '../data/neurosciencePillars';

interface NeuroscienceGuideProps {
  onSelectAction: (mode: 'socratic' | 'feynman' | 'retrieval' | 'cognitive_map') => void;
}

export const NeuroscienceGuide: React.FC<NeuroscienceGuideProps> = ({ onSelectAction }) => {
  const iconMap: Record<string, any> = {
    Zap,
    Sparkles,
    MessageSquareText: BookOpen,
    Layers,
    Flame,
    Target,
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-950/30 to-slate-900 border border-indigo-500/20 shadow-2xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Brain className="w-3.5 h-3.5" />
            Base Científica Comprovada
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Como o Cérebro Realmente Aprende: A Neurociência da Memória
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Mais de 100 anos de ciência cognitiva comprovam que os métodos mais populares de estudo (reler textos,
            destacar apostilas e assistir a aulas passivas) são os <em>menos eficazes</em>. O cérebro só consolida
            memórias quando é forçado a processar, deduzir e recuperar ativamente.
          </p>
        </div>
      </div>

      {/* Comparison: Passive vs Active Learning */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Estudo Passivo Tradicional vs. Aprendizado Ativo Synapse
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Passive column */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-3">
            <span className="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
              <XCircle className="w-4 h-4 text-rose-400" />
              O Mito do Estudo Passivo (Releitura & Resumo)
            </span>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Ilusão de Fluência:</strong> Reconhecer um texto lido gera uma falsa sensação de domínio, que se desintegra em poucas horas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Baixa Síntese Sináptica:</strong> Sem a necessidade biológica de recuperar o dado, o hipocampo descarta o traço de memória como ruído.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span><strong>Dependência de Pistas Externas:</strong> Só consegue lembrar quando o livro está aberto na frente.</span>
              </li>
            </ul>
          </div>

          {/* Active column */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              O Método Synapse (Potenciação Sináptica Ativa)
            </span>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Prática de Recuperação:</strong> Forçar a evocação do traço ativa neurotransmissores que selam o caminho neural permanentemente.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Técnica de Feynman:</strong> Desmascara jargões ocos e ancora conceitos abstratos em analogias físicas (Teoria do Duplo Código).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Dificuldades Desejáveis:</strong> O esforço consciente no estudo garante retenção de longo prazo e transferência para novos problemas.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scientific Pillars Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          Os 6 Pilares Pedagógicos Integrados no Agente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NEUROSCIENCE_PILLARS.map((pillar) => {
            const Icon = iconMap[pillar.iconName] || Brain;
            return (
              <div
                key={pillar.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{pillar.name}</h4>
                        <span className="text-[11px] text-indigo-400 font-medium">{pillar.scientist}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Fundamento Neurobiológico:
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {pillar.neuroBasis}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Aplicação Prática no Agente:
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      {pillar.practicalAction}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory Consolidation Cycle Infographic */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-400" />
          O Ciclo de Consolidação da Memória (Do Estímulo à Permanência)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-xs">
              1
            </span>
            <span className="font-bold text-slate-200 block">1. Codificação Inicial</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              O córtex sensorial e pré-frontal processam a nova ideia. Memória de trabalho sobrecarrega se houver mais de 5 itens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center text-xs">
              2
            </span>
            <span className="font-bold text-slate-200 block">2. Desconstrução Feynman</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Traduzir termos complexos em linguagem elementar força a ativação de redes semânticas profundas e analogias.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-xs">
              3
            </span>
            <span className="font-bold text-slate-200 block">3. Recuperação Ativa (LTP)</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Tentar lembrar sem olhar estimula o hipocampo a sintetizar proteínas e aumentar receptores AMPA na sinapse.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-400 font-bold flex items-center justify-center text-xs">
              4
            </span>
            <span className="font-bold text-slate-200 block">4. Espaçamento & Sono</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Revisar nos intervalos ótimos de Ebbinghaus transfere o conhecimento do hipocampo para o neocórtex permanente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
