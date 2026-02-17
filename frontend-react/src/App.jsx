import { useEffect, useMemo, useState } from 'react';
import Avatar from './components/Avatar.jsx';
import Button from './components/Button.jsx';
import Card from './components/Card.jsx';
import Input from './components/Input.jsx';
import ListItem from './components/ListItem.jsx';
import Progress from './components/Progress.jsx';
import SectionHeader from './components/SectionHeader.jsx';
import Select from './components/Select.jsx';
import StatCard from './components/StatCard.jsx';
import Tag from './components/Tag.jsx';
import TimelineItem from './components/TimelineItem.jsx';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
});

const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const currencyInput = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatCpf = (value) => {
  const digits = `${value}`.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);
  let result = part1;
  if (part2) result += `.${part2}`;
  if (part3) result += `.${part3}`;
  if (part4) result += `-${part4}`;
  return result;
};

const formatRg = (value) => {
  const digits = `${value}`.replace(/\D/g, '').slice(0, 9);
  if (!digits) return '';
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 8);
  const part4 = digits.slice(8, 9);
  let result = part1;
  if (part2) result += `.${part2}`;
  if (part3) result += `.${part3}`;
  if (part4) result += `-${part4}`;
  return result;
};

const formatCurrencyInput = (value) => {
  const digits = `${value}`.replace(/\D/g, '');
  if (!digits) return '';
  const numberValue = Number(digits) / 100;
  return currencyInput.format(numberValue);
};

const formatPercentInput = (value) => {
  const digits = `${value}`.replace(/\D/g, '').slice(0, 5);
  if (!digits) return '';
  const numberValue = Number(digits) / 100;
  return `${numberValue.toFixed(2).replace('.', ',')}%`;
};

const investorStats = [
  { label: 'Total investido', value: currency.format(2480000), hint: '12% acima do mes passado' },
  { label: 'Em aberto', value: currency.format(685000), hint: '54 operacoes ativas' },
  { label: 'Recebido', value: currency.format(1960000), hint: `${currency.format(182000)} nos ultimos 30 dias`, tone: 'success' },
  { label: 'Risco medio', value: 'Moderado', hint: `Taxa media ${percent.format(0.021)} a.m.` }
];

const carteiraAtiva = [
  { title: 'Rede Horizonte', subtitle: 'Credito rotativo - 18 parcelas', meta: currency.format(112000) },
  { title: 'Casa Lina', subtitle: 'Capital de giro - 12 parcelas', meta: currency.format(64500) },
  { title: 'Vila do Sol', subtitle: 'Reforma - 24 parcelas', meta: currency.format(180000) }
];

const borrowerTimeline = [
  { title: 'Parcela 09', subtitle: 'Vencimento 10/10/2024', meta: currency.format(6850), status: 'paid' },
  { title: 'Parcela 10', subtitle: 'Vencimento 10/11/2024', meta: currency.format(6850), status: 'due' },
  { title: 'Parcela 11', subtitle: 'Vencimento 10/12/2024', meta: currency.format(6850), status: 'late' }
];

const simulacaoResultados = [
  { label: 'Taxa sugerida', value: `${percent.format(0.0205)} a.m.` },
  { label: 'Valor total', value: currency.format(144900) },
  { label: 'Parcela estimada', value: currency.format(6850) }
];

const parcelasSimuladas = Array.from({ length: 6 }, (_, index) => ({
  numero: index + 1,
  valor: currency.format(6850)
}));

const pagamentosRecentes = [
  { title: 'Pagamento #1042', subtitle: 'Confirmado em 02/09/2024', meta: currency.format(6850) },
  { title: 'Pagamento #1041', subtitle: 'Confirmado em 02/08/2024', meta: currency.format(6850) },
  { title: 'Pagamento #1040', subtitle: 'Confirmado em 02/07/2024', meta: currency.format(6850) }
];

export default function App() {
  const [isFormalizacaoOpen, setIsFormalizacaoOpen] = useState(false);
  const [formalizacaoStatus, setFormalizacaoStatus] = useState('');
  const [simulacaoForm, setSimulacaoForm] = useState({
    clienteNome: '',
    rendaMensal: '',
    valorSolicitado: '',
    prazo: '12',
    tipoJuros: 'simples',
    taxaMaxima: ''
  });

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        setIsFormalizacaoOpen(false);
      }
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const parseCurrencyMask = (value) => {
    const numeric = Number(`${value}`.replace(/\D/g, ''));
    return Number.isFinite(numeric) ? numeric / 100 : 0;
  };

  const parsePercentMask = (value) => {
    const numeric = Number(`${value}`.replace(/\D/g, ''));
    return Number.isFinite(numeric) ? numeric / 100 : 0;
  };

  const resumoFormalizacao = useMemo(() => {
    const principal = parseCurrencyMask(simulacaoForm.valorSolicitado);
    const taxaPercentual = parsePercentMask(simulacaoForm.taxaMaxima);
    return {
      cliente: simulacaoForm.clienteNome || 'Nao informado',
      principal: principal > 0 ? currencyInput.format(principal) : 'R$ 0,00',
      taxa: taxaPercentual > 0 ? `${taxaPercentual.toFixed(2).replace('.', ',')}%` : '0,00%',
      parcelas: `${simulacaoForm.prazo}x`
    };
  }, [simulacaoForm]);

  const handleSimulacaoField = (field) => (event) => {
    setSimulacaoForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const openFormalizacao = () => {
    setFormalizacaoStatus('');
    setIsFormalizacaoOpen(true);
  };

  const confirmarFormalizacao = () => {
    setIsFormalizacaoOpen(false);
    setFormalizacaoStatus('Contratacao formalizada com sucesso. A operacao segue para assinatura digital.');
  };

  return (
    <div className="min-h-screen bg-sand text-ink">
      <div className="relative overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 animate-float-slow rounded-full bg-primary-100/80 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 animate-float-slow rounded-full bg-amber-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-96 w-96 animate-float-slow rounded-full bg-emerald-100/70 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white">M</div>
          <div>
            <p className="text-sm font-semibold tracking-wide">MultiplicaMoney</p>
            <p className="text-xs text-slate-500">Plataforma de credito colaborativo</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-500 md:flex">
          <a href="#overview" className="hover:text-ink">Visao geral</a>
          <a href="#investor" className="hover:text-ink">Investidor</a>
          <a href="#borrower" className="hover:text-ink">Tomador</a>
          <a href="#simulacao" className="hover:text-ink">Simulacao</a>
          <a href="#cadastro" className="hover:text-ink">Cadastro</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost">Nova simulacao</Button>
          <Avatar name="Dora Lima" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-20 px-6 pb-24">
        <section id="overview" className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 motion-safe:animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">Credito inteligente</p>
            <h1 className="hero-title text-4xl font-semibold text-ink sm:text-5xl">
              Decida com dados, conecte capital e crescimento local.
            </h1>
            <p className="text-sm text-slate-600">
              Gere simulacoes em segundos, acompanhe risco e automatize cobranca. Tudo com
              transparencia para investidores e tomadores.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Explorar carteira</Button>
              <Button variant="subtle">Ver detalhes do contrato</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag>Risco calibrado</Tag>
              <Tag tone="success">Pix instantaneo</Tag>
              <Tag tone="primary">Score por renda</Tag>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {investorStats.map((stat, index) => (
              <div
                key={stat.label}
                className="motion-safe:animate-fade-up"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <StatCard {...stat} />
              </div>
            ))}
          </div>
        </section>

        <section id="investor" className="space-y-8">
          <SectionHeader
            title="Dashboard do investidor"
            description="Visao consolidada da carteira ativa e resultados esperados."
            action={<Button variant="ghost">Exportar relatorio</Button>}
          />
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <Card title="Carteira ativa">
              <div className="space-y-3">
                {carteiraAtiva.map((item) => (
                  <ListItem key={item.title} {...item} />
                ))}
              </div>
            </Card>
            <Card title="Saude da carteira">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Operacoes adimplentes</span>
                    <span>82%</span>
                  </div>
                  <Progress value={82} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Parcelas em dia</span>
                    <span>91%</span>
                  </div>
                  <Progress value={91} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Retorno projetado</span>
                    <span>18% a.a.</span>
                  </div>
                  <Progress value={64} />
                </div>
                <div className="rounded-2xl bg-primary-50 px-4 py-3 text-xs text-primary-700">
                  Limite de exposicao recomendado: R$ 250.000 por setor.
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="borrower" className="space-y-8">
          <SectionHeader
            title="Dashboard do tomador"
            description="Controle de parcelas e proximas acoes do contrato."
            action={<Button>Pagar agora</Button>}
          />
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <Card title="Resumo do contrato">
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Saldo devedor</span>
                  <span className="font-semibold text-ink">{currency.format(54800)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Proxima parcela</span>
                  <span className="font-semibold text-ink">10/11/2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Score de risco</span>
                  <Tag>Moderado</Tag>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-600">
                  Ajuste sugerido: manter comprometimento abaixo de 38% da renda.
                </div>
              </div>
            </Card>
            <Card title="Cronograma de parcelas">
              <div className="space-y-3">
                {borrowerTimeline.map((item) => (
                  <TimelineItem key={item.title} {...item} />
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="simulacao" className="space-y-8">
          <SectionHeader
            title="Simulacao express"
            description="Valide o valor, taxa e parcelas antes de formalizar o contrato."
          />
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <Card title="Dados do tomador">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nome do cliente"
                  placeholder="Ex: Joao Silva"
                  value={simulacaoForm.clienteNome}
                  onChange={handleSimulacaoField('clienteNome')}
                />
                <Input
                  label="Renda mensal"
                  format={formatCurrencyInput}
                  inputMode="decimal"
                  placeholder={currency.format(18000)}
                  value={simulacaoForm.rendaMensal}
                  onChange={handleSimulacaoField('rendaMensal')}
                />
                <Input
                  label="Valor solicitado"
                  format={formatCurrencyInput}
                  inputMode="decimal"
                  placeholder={currency.format(120000)}
                  value={simulacaoForm.valorSolicitado}
                  onChange={handleSimulacaoField('valorSolicitado')}
                />
                <Select
                  label="Prazo"
                  value={simulacaoForm.prazo}
                  onChange={handleSimulacaoField('prazo')}
                  options={[
                    { value: '12', label: '12 parcelas' },
                    { value: '18', label: '18 parcelas' },
                    { value: '24', label: '24 parcelas' }
                  ]}
                />
                <Select
                  label="Tipo de juros"
                  value={simulacaoForm.tipoJuros}
                  onChange={handleSimulacaoField('tipoJuros')}
                  options={[
                    { value: 'simples', label: 'Simples' },
                    { value: 'composto', label: 'Composto' }
                  ]}
                />
                <Input
                  label="Taxa maxima"
                  format={formatPercentInput}
                  inputMode="decimal"
                  placeholder={`${percent.format(0.025)} a.m.`}
                  value={simulacaoForm.taxaMaxima}
                  onChange={handleSimulacaoField('taxaMaxima')}
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button>Gerar simulacao</Button>
                <Button variant="ghost" onClick={openFormalizacao}>Formalizar contratacao</Button>
              </div>
            </Card>
            <Card title="Resultado preliminar">
              <div className="space-y-4">
                {formalizacaoStatus ? (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    {formalizacaoStatus}
                  </div>
                ) : null}
                {simulacaoResultados.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold text-ink">{item.value}</span>
                  </div>
                ))}
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500">Valor de cada parcela</p>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    {parcelasSimuladas.map((parcela) => (
                      <div key={parcela.numero} className="flex items-center justify-between">
                        <span>Parcela {parcela.numero}</span>
                        <span className="font-semibold text-ink">{parcela.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-600">
                  Parcela dentro do limite de 40% da renda.
                </div>
                <div className="rounded-2xl bg-primary-50 px-4 py-3 text-xs text-primary-700">
                  Score sugerido: B+ | Limite recomendado: R$ 150.000.
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="detalhe" className="space-y-8">
          <SectionHeader
            title="Detalhe do emprestimo"
            description="Acompanhe status, pagamentos e prorrogacoes." />
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card title="Contrato ativo">
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Tag tone="success">Adimplente</Tag>
                </div>
                <div className="flex items-center justify-between">
                  <span>Principal</span>
                  <span className="font-semibold text-ink">{currency.format(120000)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxa contratada</span>
                  <span className="font-semibold text-ink">{percent.format(0.0205)} a.m.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Parcelas</span>
                  <span className="font-semibold text-ink">24x</span>
                </div>
              </div>
            </Card>
            <Card title="Pagamentos recentes">
              <div className="space-y-3">
                {pagamentosRecentes.map((item) => (
                  <ListItem key={item.title} {...item} />
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="cadastro" className="space-y-8">
          <SectionHeader
            title="Cadastro de cliente"
            description="Inclua dados pessoais, contatos e multiplos enderecos."
            action={<Button variant="ghost">Importar CSV</Button>}
          />
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card title="Informacoes do cliente">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nome completo" placeholder="Ex: Maria Costa" />
                <Input label="CPF" format={formatCpf} placeholder={formatCpf('00000000000')} />
                <Input label="RG" format={formatRg} placeholder={formatRg('000000000')} />
                <Input label="Email" placeholder="maria@email.com" />
                <Input label="Telefone" placeholder="(11) 99999-0000" />
                <Input label="Renda mensal" format={formatCurrencyInput} inputMode="decimal" placeholder={currency.format(12000)} />
                <Select
                  label="Tipo de trabalho"
                  options={[
                    { value: 'AUTONOMO', label: 'Autonomo' },
                    { value: 'CLT', label: 'CLT' },
                    { value: 'CNPJ_MEI', label: 'CNPJ (MEI)' }
                  ]}
                />
              </div>
            </Card>
            <Card title="Enderecos">
              <div className="space-y-4">
                <div className="rounded-3xl border border-dashed border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">Endereco principal</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input label="Rua" placeholder="Rua das Flores" />
                    <Input label="Numero" placeholder="120" />
                    <Input label="Cidade" placeholder="Sao Paulo" />
                    <Input label="Estado" placeholder="SP" />
                  </div>
                </div>
                <div className="rounded-3xl border border-dashed border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500">Endereco secundario</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input label="Rua" placeholder="Av. Norte" />
                    <Input label="Numero" placeholder="45" />
                    <Input label="Cidade" placeholder="Campinas" />
                    <Input label="Estado" placeholder="SP" />
                  </div>
                </div>
                <Button variant="subtle">Adicionar endereco</Button>
              </div>
            </Card>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>Salvar cadastro</Button>
            <Button variant="ghost">Concluir simulacao</Button>
          </div>
        </section>
      </main>

      {isFormalizacaoOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsFormalizacaoOpen(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-primary-200 bg-white p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-ink">Confirmar formalizacao da contratacao</h3>
            <p className="mt-2 text-sm text-slate-600">
              Voce esta prestes a formalizar este contrato. Revise os dados abaixo antes de confirmar.
            </p>
            <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cliente</span>
                <strong className="text-ink">{resumoFormalizacao.cliente}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Valor principal</span>
                <strong className="text-ink">{resumoFormalizacao.principal}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Taxa de juros</span>
                <strong className="text-ink">{resumoFormalizacao.taxa}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Parcelas</span>
                <strong className="text-ink">{resumoFormalizacao.parcelas}</strong>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsFormalizacaoOpen(false)}>Cancelar</Button>
              <Button onClick={confirmarFormalizacao}>Confirmar formalizacao</Button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-slate-100 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-slate-500">
          <span>MultiplicaMoney 2024</span>
          <span>Seguranca, transparencia e impacto local.</span>
        </div>
      </footer>
    </div>
  );
}
