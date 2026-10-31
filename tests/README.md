# Testes de navegador — Crônicas de Aurora

As suítes abrem o jogo no Edge headless via Playwright e testam o jogo real
(`index.html` + scripts clássicos), não apenas funções isoladas.

## Preparação

1. Instale as dependências (uma vez):

   ```powershell
   cd tests
   npm install
   ```

2. Sirva o projeto em `http://127.0.0.1:8123` (o `file://` também funciona para
   jogar, mas os testes usam HTTP):

   ```powershell
   cd ..
   python -m http.server 8123 --bind 127.0.0.1
   ```

3. Rode tudo:

   ```powershell
   cd tests
   npm test
   ```

Também é possível rodar uma suíte só: `npm run test:smoke` ou
`npm run test:combat`.

## Variáveis de ambiente

- `AURORA_URL`: URL do jogo (padrão `http://127.0.0.1:8123/`).
- `EDGE_PATH`: caminho do `msedge.exe` (padrão do Windows).

## Suítes atuais

- `smoke.js`: boot, login, criação, HUD de vigor, esquiva, i-frames, save v4,
  backup rotativo, recuperação de save corrompido e migração de personagem
  antigo.
- `combat.js`: telegrafia circular/cone/linha, resolução no fim do windup,
  esquiva do AUTO, onda do chefe e status de lentidão/queimadura.

Os testes limpam o `localStorage` do perfil headless, nunca o save do jogador.
