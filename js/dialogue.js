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
        { label: 'Já nos falamos antes?', next: 'memoria', condition: { hasFlag: 'orla_conversou' } },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou' } }
      ]
    },
    vila: {
      text: 'Os campos estão inquietos, mas a praça segue viva. Se for sair, leve ao menos uma poção de vida.',
      options: [
        { label: 'Obrigado pelo conselho.', next: 'start' },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou' } }
      ]
    },
    memoria: {
      text: 'Ah, você de novo! Bom ver que ainda está de pé. Volte sempre que precisar.',
      options: [
        { label: 'Até mais, Orla.', end: true }
      ]
    },
    selo: {
      text: 'O selo de Aurora treme. Se Aldric pediu o Núcleo Glacial, é porque a Cidadela já respira. Tenha cuidado.',
      options: [
        { label: 'Obrigado, Orla.', next: 'start' },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou' } }
      ]
    },
    shop: {
      text: 'Escolha com calma. Poção de vida restaura 45% da vida; de mana, 50% da mana.',
      options: [
        { label: 'Abrir loja de poções.', next: 'servico', effect: { service: 'shop_potion' } },
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou' } }
      ]
    },
    servico: {
      text: 'Pode usar os botões de serviço abaixo. Estou à disposição.',
      options: [
        { label: 'Encerrar conversa.', end: true, effect: { setFlag: 'orla_conversou' } }
      ]
    }
  };

  const D = {};

  function ensureStory(p) {
    if (!p.story) p.story = { chapter: 1, step: 0, flags: {} };
    if (!p.story.flags) p.story.flags = {};
    return p.story;
  }

  D.check = function (cond, p) {
    if (!cond) return true;
    if (Array.isArray(cond)) return cond.every(c => D.check(c, p));
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
      const rel = (p.npcRelations && p.npcRelations[cond.relation.npc]) || 0;
      if (rel < cond.relation.min) return false;
    }
    return true;
  };

  D.applyEffect = function (effect, p) {
    if (!effect || !p) return;
    const list = Array.isArray(effect) ? effect : [effect];
    list.forEach(e => {
      if (!e) return;
      ensureStory(p);
      const flags = p.story.flags;
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
        // serviço solicitado pelo diálogo: fecha a conversa e abre o serviço via NPC.
        if (A.game && typeof A.game.npcAction === 'function') {
          // adiado: apenas marca para a UI tratar; a UI chama npcAction.
          p._pendingService = e.service;
        }
      }
    });
  };

  D.availableOptions = function (node, p) {
    const opts = (node && Array.isArray(node.options)) ? node.options : [];
    const out = [];
    opts.forEach((opt, i) => {
      if (D.check(opt.condition, p)) {
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