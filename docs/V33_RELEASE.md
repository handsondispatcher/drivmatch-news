# DrivMatch News — RELEASE v33 (Polimento Editorial)

**Data:** 09/10/2026  
**Estado:** `development_prelaunch` — `public_launch_approved=false`. **Não comunicar lançamento ao público.**

## Zero-loss snapshot da v32

A `main` que estava publicada e testada antes desta revisão é preservada, sem modificações, em:

- Branch protegida por processo (sem branch protection automática): [`backup/v32-approved-2026-10-09`](https://github.com/handsondispatcher/drivmatch-news/tree/backup/v32-approved-2026-10-09).
- Commit SHA exato: **`659a146b8f48c342c2a62d86a1330d59760116d4`**.
- Este backup contém todos os arquivos rastreados pelo Git na baseline v32; não é um snapshot independente de infraestrutura externa ou do conteúdo dinâmico de terceiros.
- **Rollback** se necessário: abrir um PR restaurando o tree/commit acima em `main`; executar CI e deploy antes de anunciar reversão. Não dar reset/force push apagando trabalho. O histórico v33 continua preservado.

## v33 é uma revisão incremental; v32 permanece referência de comparação

### Aplicado ao código, sem copiar identidade de portais externos

1. **Hierarquia editorial / legibilidade:** largura de mercado ampliada no desktop (até 350 px); melhoria de títulos, metadados, espaçamentos, linhas de leitura e hierarquia do Panorama; melhoria dos valores/fonte/horário dos dados de mercado.
2. **Panorama:** a composição v31/v32 permanece **1 manchete hero + 3 relacionadas**. Navegação usa setas de 35 px e bolinhas acessíveis na mesma barra; bolinhas saltam diretamente a qualquer página, recebem nomes e `aria-current` e funcionam também via teclado. Gestos horizontais no Panorama para celular, sem interferir na rolagem vertical.
3. **5 manchetes em foco:** bloco derivado **unicamente** das manchetes já presentes nos resultados filtrados, sem alegar aprovação editorial das fontes externas nem fabricar chamadas. Clicar abre o mesmo leitor/links com atribuição; não é ranking humano e nem conteúdo novo inventado. Textos e rótulos em PT/EN/ES.
4. **Respeito às decisões:** identidade azul horizontal aprovada preservada sem redesenho; filtros/idiomas, Ventusky, cotação de dólar comercial e data de verificação, diesel e mercados de fonte autorizada, crawler, imagens de arquivo licenciadas, modal Android compacto, compartilhamento social, rodapé e feed separado para DrivMatch Live mantidos.
5. **Nenhum novo dado de mercado simulado:** conectores pagos, licenciamento, direitos e vetting editorial continuam sendo bloqueios do release gate.

### Deliberadamente não implementado sem aprovação e evidência

- Sínteses `Por que importa?` por perfil profissional **não são geradas automaticamente** a partir de apenas título RSS; requerem leitura de fonte, evidência, checagem de data/jurisdição, julgamento editorial e revisão humana.
- Newsletter não ativada sem serviço de assinatura, política de consentimento e governança de dados.
- Publicidade não é adicionada sem contrato, identificação, direitos e teste de experiência.
- Portais dos screenshots do usuário são **benchmarks de hierarquia visual** e não fontes de componentes, logo ou imagens copiáveis.

### Limite de aceite obrigatório

- Testes Python + smoke JS, build de conteúdos reais e fotos licenciadas, browser Playwright 360/390/768/1440 px.
- Conferir: **zero overflow horizontal**, 1 hero + 3 relacionadas, modal mobile sem scroll desnecessário, 3 idiomas e fontes, botões share/copiar visíveis; controles de Panorama acessíveis e navegáveis; módulo de 5 manchetes funciona; metadados de versão v33 e restore v32 registrados.
- Deploy GitHub Pages + smoke via `.github/workflows/deploy.yml` confirmam HTML e manifesto público v33, fotos JPEG reais, páginas sociais, DrivMatch Live export e custom domain.
- O **issue #18** permanece ABERTO até homologação de conteúdo/direitos/visual/fonte no dispositivo real do usuário.

**Princípio:** v33 é polimento e usabilidade, não novo desenho, lançamento ou substituição destrutiva de v32.
