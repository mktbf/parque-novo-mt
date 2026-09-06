# Continue no Antigravity — layout do PDF

## Importação
1. Crie uma branch no repositório existente, por exemplo `feat/site-pnmt`.
2. Extraia este ZIP em uma pasta separada e abra `dist/index.html` para conferir a referência visual.
3. Peça ao Antigravity para examinar o repositório existente e importar o projeto sem sobrescrever configurações ou código não relacionado.
4. Se o repositório já usa um framework, adapte estes componentes à arquitetura existente preservando visual, conteúdo e funções. Se estiver vazio, esta versão estática pode ser usada diretamente.

## Prompt para colar no Antigravity

Continue este site do Parque Novo Mato Grosso a partir dos arquivos entregues. A referência visual vigente é reference/Proposta-site-PNMT.pdf. Siga esse layout e suas frases. Não substitua por outra direção de arte. Preserve dist/reference-layout.css, carregado após styles.css, e as fontes locais Barlow Regular 400, Bold 700, ExtraBold 800 e Barlow Condensed SemiBold 600. A Home e Quem Somos já foram adaptadas a essa referência. O carrossel inclinado deve continuar funcional no desktop e no celular. Primeiro leia LEIA-ME.md, REVISAO-EDITORIAL.md, FONTES-E-CREDITOS.md e a estrutura do meu repositório. Trabalhe em uma nova branch e preserve as configurações e os arquivos existentes que não fazem parte desta mudança.

A versão atual está em dist/index.html, dist/styles.css, dist/fonts.css, dist/content.js, dist/config.js e dist/app.js. O site tem Home, Quem somos, catálogo, as 21 páginas de espaços, Agenda, Imprensa, Galeria, Quero visitar, Contato e Outros assuntos. Preserve o layout, as marcas, a paleta do manual, os textos fornecidos e as notas sobre informações ainda não confirmadas. Não substitua as fotos por imagens de outros lugares nem invente agenda, contatos ou capacidades.

Faça nesta ordem:
1. Execute a versão local e confira em navegador a navegação, os filtros, a busca, os formulários, os downloads, o vídeo e os layouts a 360, 390, 768, 1024 e 1440 pixels. Corrija problemas de transbordamento, leitura, teclado e toque.
2. Adapte à arquitetura existente do repositório, caso necessário, mantendo uma referência da versão recebida. Preserve rotas equivalentes e links dos 21 espaços. Se já houver um framework com roteamento, use páginas próprias e metadados por página.
3. Conecte formulários a um backend real do projeto. Veja o contrato JSON em config.js. Implemente recebimento, validação no servidor, armazenamento/encaminhamento ao atendimento, proteção contra abuso, tratamento de erros e segredo das credenciais. Não mostre sucesso antes de confirmar recebimento. O cadastro de interesse precisa de uma integração real de avisos; não prometa atualizações automáticas só por salvar um formulário. Peça o destino de atendimento e as credenciais que não estiverem disponíveis no ambiente, sem colocar segredos no frontend.
4. Centralize os dados de espaços, eventos, notícias e fotos em conteúdo editável. Use o CMS ou banco já adotado no repositório. Há um registro histórico adicionado em app.js que deve ser movido para a mesma fonte dos demais eventos. Separe eventos passados e futuros e preserve categorias, local, data, ingresso, créditos e URLs oficiais. Não crie dados fictícios para preencher a interface.
5. Valide o vídeo https://www.youtube.com/watch?v=plKmM21Rh0Q via HTTP/HTTPS. Mantenha o acesso direto ao YouTube caso o player seja bloqueado.
6. Faça a revisão final de responsividade, acessibilidade, carregamento das imagens, SEO e regressão. Rode as verificações existentes do repositório. Mostre o diff e as pendências antes de publicar ou mesclar na branch principal.

Considere os números marcados no REVISAO-EDITORIAL.md como pendentes de aprovação. Não volte a publicá-los automaticamente. Preserve os créditos de todas as imagens. O kit é um pacote de referência da marca, não um conjunto de fotos de terceiros liberadas para redistribuição.

Ao concluir, explique o que foi integrado, o que foi testado e o que ainda depende de informação minha.

## O que já funciona e o que falta
- Pronto localmente: navegação, textos, busca, filtros, galeria com ampliação, kit, formulários com validação e preparação de cópia, vídeo incorporado com alternativa externa, estrutura responsiva.
- A integrar: envio real e recebimento dos formulários, cadastro e disparo de avisos, CMS/painel ou fonte de conteúdo conforme o repositório.
- A validar: player na origem final, teste visual em navegador e dados editoriais destacados no documento de revisão.

Não há package.json ou comando npm obrigatório nesta entrega: ela é estática. Para servir, execute `python -m http.server 8000 --directory dist` na raiz do projeto e abra http://localhost:8000.
