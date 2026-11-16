/* =========================================================
   Modelo de PDF "Meu Estúdio, Meu Lucro"
   Recebe o resultado do cálculo (index.html → DiamondPDF.abrir(r)),
   monta uma folha A4 própria, mostra a prévia e baixa o PDF.
   Depende de: pdf.css, html2canvas, jsPDF (carregados no index.html).
   ========================================================= */
(function(){
  const W = 794, H = 1123;                       // A4 em px (96 dpi)
  const brl = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const fmt = n => isFinite(n) ? brl.format(n) : '—';
  const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  const DIAMANTE = '<svg width="30" height="24" viewBox="0 0 40 32" fill="none" stroke="#e6c27a" stroke-width="1.6" stroke-linejoin="round"><path d="M4 11 L11 3 H29 L36 11 L20 30 Z"/><path d="M4 11 H36 M11 3 L15 11 L20 30 L25 11 L29 3 M15 11 L20 3 L25 11"/></svg>';
  const MARCA = {
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 L9.5 18 L20 6"/></svg>',
    warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M12 4 V14 M12 19.5 V20"/></svg>',
    bad:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>',
    idle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M6 12 H18"/></svg>'
  };

  /* ---------- monta a folha ---------- */
  function montarFolha(r){
    const ativos = r.tipos.filter(t => t.ativo);
    const data = new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
    const neg = r.lucro < 0;

    const col = (fn) => ativos.map(t => `<td>${fn(t)}</td>`).join('');
    const lucroAt = t => t.P - t.custoReal;
    const linhas = `
      <tr><td>Atendimentos no mês</td>${col(t => t.N)}</tr>
      <tr><td>Valor cobrado</td>${col(t => fmt(t.P))}</tr>
      <tr><td>Material por atendimento</td>${col(t => fmt(t.m))}</tr>
      <tr><td>Faturamento no mês</td>${col(t => fmt(t.N*t.P))}</tr>
      <tr><td>Custo real por atendimento<small>material + parte das despesas fixas</small></td>${col(t => fmt(t.custoReal))}</tr>
      <tr class="hl"><td>Lucro por atendimento<small>valor cobrado − custo real</small></td>${ativos.map(t => `<td class="${lucroAt(t)<0?'neg':''}">${fmt(lucroAt(t))}</td>`).join('')}</tr>`;

    const metaSub = r.meta === r.S ? 'o seu pró-labore' : 'a sua meta';

    return `
    <div class="pf-sheet">
      <div class="pf-frame"></div>
      <header class="pf-head">
        <div class="pf-gem">${DIAMANTE}</div>
        <div class="pf-imersao">IMERSÃO</div>
        <div class="pf-diamond">DIAMOND</div>
        <div class="pf-title">Meu Estúdio, Meu Lucro</div>
        <div class="pf-sub">Plano de precificação${r.nome?`<span class="sep">◆</span><b>${esc(r.nome)}</b>`:''}<span class="sep">◆</span>${data}</div>
      </header>

      <div class="pf-kpis">
        <div class="pf-kpi"><div class="l">Faturamento mensal</div><div class="v">${fmt(r.fat)}</div><div class="s">${r.N} atendimentos no mês</div></div>
        <div class="pf-kpi"><div class="l">Custo total</div><div class="v">${fmt(r.custo)}</div><div class="s">materiais + despesas fixas</div></div>
        <div class="pf-kpi gold ${neg?'neg':''}"><div class="l">${neg?'Prejuízo no mês':'Lucro real (o que sobra)'}</div><div class="v">${fmt(neg?-r.lucro:r.lucro)}</div><div class="s">${neg?'o faturamento não cobre os custos':'o seu pró-labore de verdade'}</div></div>
      </div>

      <section class="pf-sec">
        <div class="pf-tag">Seus Dados</div>
        <table class="pf-table">
          <thead><tr><th></th>${ativos.map(t => `<th>${cap(t.nome)}</th>`).join('')}</tr></thead>
          <tbody>${linhas}</tbody>
        </table>
        <div class="pf-extra">
          <div>Despesas fixas mensais<b>${fmt(r.D)}</b></div>
          <div>Pró-labore desejado<b>${fmt(r.S)}</b></div>
          <div>Total de atendimentos<b>${r.N} no mês</b></div>
        </div>
      </section>

      <div class="pf-cols">
        <section class="pf-sec">
          <div class="pf-tag">Cálculos</div>
          <div class="pf-step"><div class="pf-num">1</div><div class="t">Faturamento mensal</div><div class="v">${fmt(r.fat)}</div></div>
          <div class="pf-step"><div class="pf-num">2</div><div class="t">Custo total de materiais</div><div class="v">${fmt(r.mat)}</div></div>
          <div class="pf-step"><div class="pf-num">3</div><div class="t">Custo total<small>materiais + despesas</small></div><div class="v">${fmt(r.custo)}</div></div>
          <div class="pf-step"><div class="pf-num">4</div><div class="t">Custo por atendimento<small>média geral</small></div><div class="v">${fmt(r.cpa)}</div></div>
        </section>
        <section class="pf-sec">
          <div class="pf-tag">Sua Meta</div>
          <div class="pf-meta">
            <div class="pf-q">Para sobrar <b>${fmt(r.meta)}</b> no mês (${metaSub}), você precisa de</div>
            <div class="big">${isFinite(r.need) ? r.need : '—'}</div>
            <div class="u">${isFinite(r.need) ? r.needUnidade + ' no mês' : 'ajuste os valores'}</div>
            ${r.needSplit ? `<div class="pf-split">≈ ${r.needSplit}</div>` : ''}
          </div>
        </section>
      </div>

      <section class="pf-sec">
        <div class="pf-tag">Resultado</div>
        <ul class="pf-checks">
          ${r.checks.map(c => `<li><span class="pf-mark ${c.kind}">${MARCA[c.kind]||''}</span><div><div class="t">${c.title}</div>${c.desc?`<div class="d">${c.desc}</div>`:''}</div></li>`).join('')}
        </ul>
      </section>

      <div class="pf-foot">Imersão Diamond · Meu Estúdio, Meu Lucro</div>
    </div>`;
  }

  /* garante que tudo caiba em 1 página */
  function ajustar(folha){
    const limite = H - 52; // acima do rodapé
    const fundo = () => Math.max(...[...folha.children].filter(e => !e.classList.contains('pf-foot') && !e.classList.contains('pf-frame'))
                                     .map(e => e.offsetTop + e.offsetHeight));
    if(fundo() > limite) folha.classList.add('compact');
    let s = 1;
    while(fundo() > limite && s > 0.8){        // último recurso: reduz a letra aos poucos
      s -= 0.03;
      folha.querySelectorAll('.pf-checks .d, .pf-table, .pf-step .t').forEach(e => e.style.fontSize = '');
      folha.querySelectorAll('.pf-checks .d').forEach(e => e.style.fontSize = (11*s)+'px');
      folha.querySelectorAll('.pf-table').forEach(e => e.style.fontSize = (12.5*s)+'px');
    }
  }

  /* ---------- janela ---------- */
  let modal, preview, palco, dados;
  function criarJanela(){
    modal = document.createElement('div');
    modal.className = 'pf-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-label','Prévia do PDF');
    modal.innerHTML = `
      <div class="pf-bar">
        <h3>Prévia do seu PDF</h3>
        <div class="pf-btns">
          <button class="btn btn-line" type="button" data-a="voltar">Voltar</button>
          <button class="btn btn-gold" type="button" data-a="baixar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 V15 M7 10 L12 15 L17 10"/><path d="M4 17 V20 H20 V17"/></svg>
            <span>Baixar PDF</span>
          </button>
        </div>
      </div>
      <div class="pf-hint">Uma página A4, pronta para guardar no celular, mandar no WhatsApp ou imprimir.</div>
      <div class="pf-preview"></div>`;
    document.body.appendChild(modal);
    preview = modal.querySelector('.pf-preview');
    palco = document.createElement('div');
    palco.className = 'pf-stage';
    palco.setAttribute('aria-hidden','true');
    document.body.appendChild(palco);

    modal.addEventListener('click', e => {
      const a = e.target.closest('[data-a]');
      if(a && a.dataset.a === 'voltar') fechar();
      if(a && a.dataset.a === 'baixar') baixar(a);
    });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && modal.classList.contains('open')) fechar(); });
    window.addEventListener('resize', () => modal.classList.contains('open') && escalar());
  }

  function escalar(){
    const s = Math.min(1, (modal.clientWidth - 32) / W);
    preview.style.width = (W*s) + 'px';
    preview.style.height = (H*s) + 'px';
    const f = preview.querySelector('.pf-sheet');
    if(f) f.style.transform = `scale(${s})`;
  }

  async function abrir(r){
    if(!modal) criarJanela();
    dados = r;
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    // monta no palco (tamanho real) para medir e ajustar
    palco.innerHTML = montarFolha(r);
    ajustar(palco.firstElementChild);
    preview.innerHTML = palco.innerHTML;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
    escalar();
    modal.querySelector('[data-a="baixar"]').focus();
  }

  function fechar(){
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function nomeArquivo(){
    const base = (dados.nome || 'meu-estudio').normalize('NFD').replace(/[̀-ͯ]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'meu-estudio';
    return `meu-lucro-${base}.pdf`;
  }

  async function gerarPDF(){
    const folha = palco.firstElementChild;
    const canvas = await window.html2canvas(folha, {
      scale: 2.5, width: W, height: H, windowWidth: W, windowHeight: H,
      backgroundColor: '#0b0907', useCORS: true, logging: false
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({orientation:'portrait', unit:'mm', format:'a4', compress:true});
    pdf.setProperties({title:'Meu Estúdio, Meu Lucro' + (dados.nome ? ' · ' + dados.nome : ''), creator:'Imersão Diamond'});
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
    return pdf;
  }

  async function baixar(btn){
    if(!window.html2canvas || !window.jspdf){ alert('Ainda carregando… tente de novo em alguns segundos.'); return; }
    const rot = btn.querySelector('span'), antes = rot.textContent;
    btn.disabled = true; rot.textContent = 'Gerando…';
    try{
      const pdf = await gerarPDF();
      const nome = nomeArquivo();
      const blob = pdf.output('blob');
      const arquivo = new File([blob], nome, {type:'application/pdf'});
      // no celular, abre o "compartilhar" (salvar em Arquivos, WhatsApp…); no computador, baixa direto
      const celular = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if(celular && navigator.canShare && navigator.canShare({files:[arquivo]})){
        try{ await navigator.share({files:[arquivo], title:'Meu Estúdio, Meu Lucro'}); }
        catch(e){ if(!e || e.name !== 'AbortError') pdf.save(nome); }
      }else{
        pdf.save(nome);
      }
    }catch(e){
      console.error(e);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    }finally{
      btn.disabled = false; rot.textContent = antes;
    }
  }

  window.DiamondPDF = { abrir, montarFolha, _gerar: gerarPDF };
})();
