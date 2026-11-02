/* ==========================================================================
   DIÁLOGOS — árvores condicionais e efeitos narrativos (Etapa 2)
   ========================================================================== */
(function (A) {
  'use strict';

  A.DIALOGUES = A.DIALOGUES || {};

  // Diálogo de demonstração para Orla (misericordiosa e prática).
  A.DIALOGUES.orla = {
    start: {
      text: 'Poções fresquinhas, ervas do campo e o melhor preço da vila! Posso ajudar em algo, viajante?',
      options: [
        { label: 'Quero ver as poções.', next: 'shop' },
        { label: 'Como está a vila hoje?', next: 'vila' },
        { label: 'Sobre o selo...', next: 'selo', condition: { questActive: 'q26' } },
        { label: 'Voce parece mais amigavel.', next: 'confianca', condition: { relation: { min: 10 } } },
        { label: 'Já nos falamos antes?', next: 'memoria', condition: { hasMemory: 'orla_primeira_conversa' } },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou', remember: 'orla_primeira_conversa', changeRelation: 3 } }
      ]
    },
    vila: {
      text: 'Os campos estão inquietos, mas a praça segue viva. Se for sair, leve ao menos uma poção de vida.',
      options: [
        { label: 'Vou investigar o selo.', next: 'start', effect: { changeRelation: 2, learn: 'orla_sabe_da_vila' } },
        { label: 'Nao e da sua conta.', next: 'start', effect: { changeRelation: -3 } },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou', remember: 'orla_primeira_conversa' } }
      ]
    },
    memoria: {
      text: 'Ah, voce de novo! Bom ver que ainda esta de pe. Volte sempre que precisar.',
      options: [
        { label: 'Ate mais, Orla.', end: true }
      ]
    },
    confianca: {
      text: 'Gosto de quem mantem a palavra. Se precisar de algo, estarei aqui.',
      options: [
        { label: 'Obrigado, Orla.', next: 'start' },
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    shop: {
      text: 'Escolha com calma. Pocao de vida restaura 45% da vida; de mana, 50% da mana.',
      options: [
        { label: 'Abrir loja de poções.', next: 'servico', effect: { service: 'shop_potion' } },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou', remember: 'orla_primeira_conversa' } }
      ]
    },
    servico: {
      text: 'Pode usar os botões de serviço abaixo. Estou à disposição.',
      options: [
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou', remember: 'orla_primeira_conversa' } }
      ]
    },
    selo: {
      text: 'O selo de Aurora treme. Se Aldric pediu o Núcleo Glacial, é porque a Cidadela já respira. Tenha cuidado.',
      options: [
        { label: 'Obrigado, Orla.', next: 'start', effect: { changeRelation: 2, learn: 'orla_sabe_do_selos' } },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou', remember: 'orla_primeira_conversa', learn: 'orla_sabe_do_selos' } }
      ]
    }
  };

  A.DIALOGUES.marta = {
    start: {
      text: 'Ouvi passos e sussurros na praça ao anoitecer. Não era vento, tenho certeza.',
      options: [
        { label: 'O que você ouviu?', next: 'detalhe' },
        { label: 'Talvez seja só o vento.', next: 'vento' },
        { label: 'Voltei sobre os sussurros.', next: 'depois', condition: { hasFlag: 'arc1_investigando' } },
        { label: 'Sobre as descobertas recentes.', next: 'descobertas', condition: { hasFlag: 'arc1_indicios_reunidos' } },
        { label: 'Encerrar conversa.', end: true, effect: { remember: 'marta_sussurros', changeRelation: 1 } }
      ]
    },
    detalhe: {
      text: 'Uma luz fraca, quase como brasa, mas fria. Sumiu quando me aproximei.',
      options: [
        { label: 'Vou observar hoje à noite.', next: 'start', effect: { startQuest: 'arc1_q1', learn: 'sussurros_praca' } },
        { label: 'Encerrar conversa.', end: true, effect: { remember: 'marta_sussurros' } }
      ]
    },
    depois: {
      text: 'Então não era só imaginação. A luz some, mas o frio fica. Cuidado ao anoitecer.',
      options: [
        { label: 'Obrigado, Marta.', next: 'start' },
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    descobertas: {
      text: 'Os moradores falam de marcas e luzes. Algo antigo parece ter sido esquecido, não apagado.',
      options: [
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    vento: {
      text: 'Talvez. Mas o vento não olha para nós.',
      options: [
        { label: 'Encerrar conversa.', end: true }
      ]
    }
  };

  A.DIALOGUES.irene = {
    start: {
      text: 'Guardo registros antigos. Alguns nomes se repetem em sonhos que as pessoas relatam.',
      options: [
        { label: 'Que registros?', next: 'registros' },
        { label: 'Que sonhos?', next: 'sonhos' },
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    registros: {
      text: 'Cinco nomes aparecem em um pergaminho empoeirado. Não sei quem eram, mas não eram da vila.',
      options: [
        { label: 'Posso ver o pergaminho?', next: 'pergaminho' },
        { label: 'Encerrar conversa.', end: true, effect: { startQuest: 'arc1_q3' } }
      ]
    },
    sonhos: {
      text: 'Pessoas dizem ouvir vozes que prometem um mundo melhor. Não sei se são sonhos ou algo mais.',
      options: [
        { label: 'Encerrar conversa.', end: true, effect: { learn: 'cinco_vozes_rumor', npc: 'irene' } }
      ]
    },
    pergaminho: {
      text: 'O pergaminho está gasto, mas os cinco nomes permanecem. Eles podem ser pistas, ou apenas ecos.',
      options: [
        { label: 'Obrigado, Irene.', next: 'start', effect: { startQuest: 'arc1_q3', learn: 'cinco_nomes_registro', npc: 'irene' } },
        { label: 'Encerrar conversa.', end: true }
      ]
    }
  };
  A.DIALOGUES.liora = {
    start: {
      text: 'Vi uma luz estranha perto do lago dos campos. Não era fogo, nem luar.',
      options: [
        { label: 'Conte-me mais.', next: 'detalhe' },
        { label: 'Ja investigou os sussurros?', next: 'sussurros', condition: { questDone: 'arc1_q1' } },
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    detalhe: {
      text: 'Ela tremia como água, mas não molhava. Desapareceu ao amanhecer.',
      options: [
        { label: 'Vou observar nos campos.', next: 'start', effect: { startQuest: 'arc1_q2' } },
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    sussurros: {
      text: 'Marta me contou. Talvez a luz e os sussurros estejam ligados.',
      options: [
        { label: 'Vou investigar.', next: 'start', effect: { startQuest: 'arc1_q2' } },
        { label: 'Encerrar conversa.', end: true }
      ]
    }
  };

  A.DIALOGUES.irene = {
    start: {
      text: 'Guardo registros antigos. Alguns nomes se repetem em sonhos que as pessoas relatam.',
      options: [
        { label: 'Que registros?', next: 'registros' },
        { label: 'Que sonhos?', next: 'sonhos' },
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    registros: {
      text: 'Cinco nomes aparecem em um pergaminho empoeirado. Não sei quem eram, mas não eram da vila.',
      options: [
        { label: 'Posso ver o pergaminho?', next: 'pergaminho', condition: { questDone: 'arc1_q2' } },
        { label: 'Encerrar conversa.', end: true }
      ]
    },
    sonhos: {
      text: 'Pessoas dizem ouvir vozes que prometem um mundo melhor. Não sei se são sonhos ou algo mais.',
      options: [
        { label: 'Encerrar conversa.', end: true, effect: { learn: 'cinco_vozes_rumor', npc: 'irene' } }
      ]
    },
    pergaminho: {
      text: 'O pergaminho está gasto, mas os cinco nomes permanecem. Eles podem ser pistas, ou apenas ecos.',
      options: [
        { label: 'Obrigado, Irene.', next: 'start', effect: { startQuest: 'arc1_q3', learn: 'cinco_nomes_registro', npc: 'irene' } },
        { label: 'Encerrar conversa.', end: true }
      ]
    }
  };
  A.DIALOGUES.tomas = {
    start: {
      text: 'Os campos não estão como antes. Os animais evitam uma área e o silêncio pesa.',
      options: [
        { label: 'O que voce notou?', next: 'detalhe' },
        { label: 'Talvez seja so o vento.', next: 'vento' },
        { label: 'Encerrar conversa.', end: true, effect: { remember: 'tomas_campos', changeRelation: 1 } }
      ]
    },
    detalhe: {
      text: 'Marcas no chão, como se algo tivesse passado, mas sem pegadas. E uma luz fraca ao amanhecer.',
      options: [
        { label: 'Vou observar os campos.', next: 'start', effect: { startQuest: 'arc1_q4' } },
        { label: 'Encerrar conversa.', end: true, effect: { remember: 'tomas_campos' } }
      ]
    },
    vento: {
      text: 'Vento não deixa marcas. Fique atento.',
      options: [
        { label: 'Encerrar conversa.', end: true }
      ]
    }
  };
  const D = {};

  function ensureStory(p) {
    if (!p.story) p.story = { chapter: 1, step: 0, flags: {} };
    if (!p.story.flags) p.story.flags = {};
    return p.story;
  }

  D.check = function (cond, p, npcId) {
    if (!cond) return true;
    if (Array.isArray(cond)) return cond.every(c => D.check(c, p, npcId));
    p = p || {};
    const story = p.story || { chapter: 1, flags: {} };
    const flags = story.flags || {};
    if (cond.minLevel != null && !(Number(p.level || 1) >= cond.minLevel)) return false;
    if (cond.maxLevel != null && !(Number(p.level || 1) <= cond.maxLevel)) return false;
    if (cond.chapter != null && !(Number(story.chapter || 1) === cond.chapter)) return false;
    if (cond.minChapter != null && !(Number(story.chapter || 1) >= cond.minChapter)) return false;
    if (cond.questDone) {
      const ids = Array.isArray(cond.questDone) ? cond.questDone : [cond.questDone];
      if (!ids.every(id => p.quests && p.quests[id] && p.quests[id].claimed)) return false;
    }
    if (cond.questActive) {
      const ids = Array.isArray(cond.questActive) ? cond.questActive : [cond.questActive];
      if (!ids.every(id => p.quests && p.quests[id] && !p.quests[id].claimed)) return false;
    }
    if (typeof cond.hasFlag === 'string') {
      if (!flags[cond.hasFlag]) return false;
    }
    if (typeof cond.notFlag === 'string') {
      if (flags[cond.notFlag]) return false;
    }
    if (cond.flag != null) {
      if (typeof cond.flag === 'string') {
        if (!flags[cond.flag]) return false;
      } else {
        const key = cond.flag.key || cond.flag.name;
        if (cond.flag.value === undefined) {
          if (!flags[key]) return false;
        } else if (flags[key] !== cond.flag.value) return false;
      }
    }
    if (cond.relation && cond.relation.min != null) {
      const npc = cond.relation.npc || npcId;
      const rel = (p.npcRelations && p.npcRelations[npc]) || 0;
      if (rel < cond.relation.min) return false;
    }
    if (cond.relation && cond.relation.max != null) {
      const npc = cond.relation.npc || npcId;
      const rel = (p.npcRelations && p.npcRelations[npc]) || 0;
      if (rel > cond.relation.max) return false;
    }
    if (typeof cond.hasMemory === 'string') {
      const npc = npcId;
      if (!A.sys.hasMemory(p, npc, cond.hasMemory)) return false;
    } else if (cond.hasMemory && typeof cond.hasMemory === 'object') {
      const npc = cond.hasMemory.npc || npcId;
      const id = cond.hasMemory.id || cond.hasMemory.memory;
      if (!A.sys.hasMemory(p, npc, id)) return false;
    }
    if (typeof cond.notMemory === 'string') {
      if (A.sys.hasMemory(p, npcId, cond.notMemory)) return false;
    } else if (cond.notMemory && typeof cond.notMemory === 'object') {
      const npc = cond.notMemory.npc || npcId;
      const id = cond.notMemory.id || cond.notMemory.memory;
      if (A.sys.hasMemory(p, npc, id)) return false;
    }
    if (typeof cond.hasKnowledge === 'string') {
      if (!A.sys.hasKnowledge(p, npcId, cond.hasKnowledge)) return false;
    } else if (cond.hasKnowledge && typeof cond.hasKnowledge === 'object') {
      const npc = cond.hasKnowledge.npc || npcId;
      const id = cond.hasKnowledge.id || cond.hasKnowledge.knowledge;
      if (!A.sys.hasKnowledge(p, npc, id)) return false;
    }
    if (typeof cond.notKnowledge === 'string') {
      if (A.sys.hasKnowledge(p, npcId, cond.notKnowledge)) return false;
    } else if (cond.notKnowledge && typeof cond.notKnowledge === 'object') {
      const npc = cond.notKnowledge.npc || npcId;
      const id = cond.notKnowledge.id || cond.notKnowledge.knowledge;
      if (A.sys.hasKnowledge(p, npc, id)) return false;
    }
    return true;
  };

  D.applyEffect = function (effect, p, npcId) {
    if (!effect || !p) return;
    const list = Array.isArray(effect) ? effect : [effect];
    list.forEach(e => {
      if (!e) return;
      ensureStory(p);
      const flags = p.story.flags;
      const targetNpc = e.npc || npcId || null;
      if (typeof e.setFlag === 'string') {
        flags[e.setFlag] = (e.value === undefined ? true : e.value);
      }
      if (typeof e.flag === 'string') {
        flags[e.flag] = (e.value === undefined ? true : e.value);
      }
      if (typeof e.unsetFlag === 'string') {
        delete flags[e.unsetFlag];
      }
      if (typeof e.startQuest === 'string') {
        const id = e.startQuest;
        const q = A.sys && A.sys.questById ? A.sys.questById(id) : null;
        if (q && p.quests && !p.quests[id] && A.sys.startQuest) A.sys.startQuest(p, id);
      }
      if (typeof e.service === 'string') {
        if (A.game && typeof A.game.npcAction === 'function') {
          p._pendingService = e.service;
        }
      }
      // Relacionamentos (Etapa 4)
      if (e.changeRelation != null) {
        const spec = (typeof e.changeRelation === 'object') ? e.changeRelation : { delta: e.changeRelation };
        const npc = spec.npc || targetNpc;
        if (npc) A.sys.changeRelation(p, npc, spec.delta != null ? spec.delta : e.changeRelation);
      }
      if (e.setRelation != null) {
        const spec = (typeof e.setRelation === 'object') ? e.setRelation : { value: e.setRelation };
        const npc = spec.npc || targetNpc;
        if (npc) A.sys.setRelation(p, npc, (spec.value != null ? spec.value : e.setRelation));
      }
      if (e.remember != null) {
        const spec = (typeof e.remember === 'string') ? Object.assign({ id: e.remember }, e) : e.remember;
        const npc = spec.npc || targetNpc;
        if (npc) A.sys.remember(p, npc, spec.id || spec.memory, spec.type, spec.data);
      }
      if (e.forgetMemory != null) {
        const spec = (typeof e.forgetMemory === 'string') ? { id: e.forgetMemory } : e.forgetMemory;
        const npc = spec.npc || targetNpc;
        if (npc) A.sys.forgetMemory(p, npc, spec.id || spec.memory);
      }
      if (e.learn != null) {
        const spec = (typeof e.learn === 'string') ? Object.assign({ id: e.learn }, e) : e.learn;
        const npc = spec.npc || targetNpc;
        if (npc) A.sys.learn(p, npc, spec.id || spec.knowledge, spec.data);
      }
      if (e.forgetKnowledge != null) {
        const spec = (typeof e.forgetKnowledge === 'string') ? { id: e.forgetKnowledge } : e.forgetKnowledge;
        const npc = spec.npc || targetNpc;
        if (npc) A.sys.forgetKnowledge(p, npc, spec.id || spec.knowledge);
      }
    });
  };

  D.availableOptions = function (node, p, npcId) {
    const opts = (node && Array.isArray(node.options)) ? node.options : [];
    const out = [];
    opts.forEach((opt, i) => {
      if (D.check(opt.condition, p, npcId)) {
        const copy = Object.assign({}, opt);
        copy._idx = i;
        out.push(copy);
      }
    });
    return out;
  };

  D.getNode = function (dialogueId, nodeId) {
    const dlg = A.DIALOGUES && A.DIALOGUES[dialogueId];
    if (!dlg) return null;
    return dlg[nodeId] || dlg.start || null;
  };

  D.validate = function () {
    const errors = [];
    Object.keys(A.DIALOGUES || {}).forEach(dlgId => {
      const dlg = A.DIALOGUES[dlgId];
      Object.keys(dlg).forEach(nodeId => {
        const node = dlg[nodeId];
        if (!node || typeof node.text !== 'string') errors.push(dlgId + '.' + nodeId + ': texto inválido');
        (node.options || []).forEach((opt, i) => {
          if (typeof opt.label !== 'string') errors.push(dlgId + '.' + nodeId + '[' + i + ']: label inválido');
          if (!opt.end && !dlg[opt.next]) errors.push(dlgId + '.' + nodeId + '[' + i + ']: next inválido "' + opt.next + '"');
        });
      });
    });
    return errors;
  };

  A.dialogue = D;
})(window.A);