# Aurora Substorm Monitor

## Previsão por localização

A página `/` continua dedicada a Överkalix. O botão **Minha localização / My location** abre `/local/`, que aceita uma cidade europeia ou a localização aproximada do dispositivo, apenas depois do clique e da autorização do visitante. A seleção não é persistida; a preferência de idioma é guardada no navegador.

O mesmo cálculo é usado pelas duas páginas. Na página local, o oval NOAA, a luz solar, as nuvens e o mapa Windy usam as coordenadas selecionadas. A busca no oval considera todas as direções. A meteorologia consulta o ponto local e oito pontos a 75 km; as janelas exigem Sol abaixo de -6° e cobertura de nuvens de até 45%. Horários meteorológicos usam instantes Unix e são exibidos no fuso retornado pelo Open-Meteo, inclusive para localização do dispositivo e mudanças de horário de verão.

As leituras solares e o HUXt são globais. Eles não são apresentados como uma probabilidade local. As câmeras continuam identificadas como uma galeria nórdica e islandesa, e o diário pessoal permanece somente no desenvolvimento da página principal.

### Magnetômetros e cobertura

A API `/api/magnetometers` mantém as quatro estações originais por padrão. O parâmetro `stations` aceita até quatro códigos de uma lista fechada de 13 fontes FMI/IRF verificadas. A página local escolhe estações a até 550 km, com limites de latitude e de setor longitudinal. Leituras antigas ou ausentes não recebem valor zero nem entram no índice. Essa regra de proximidade fornece contexto regional e não é uma calibração de visibilidade para cada cidade.

A Islândia e outras áreas europeias sem uma fonte numérica recente integrada continuam com previsão de oval, clima e escuridão. O painel informa que a leitura magnética não está disponível. Em 1 de novembro de 2026, os endereços públicos antigos de Leirvogur não estavam acessíveis; o catálogo NASA CDAWeb para `THG_L2_MAG_LRV` terminava em 14 de outubro de 2026. Esse arquivo não foi usado como sinal em tempo real.

Fontes:

- [FMI IMAGE, dados em tempo real e licença CC BY 4.0](https://space.fmi.fi/image/realtime/UT/)
- [IRF Kiruna](https://www2.irf.se/maggraphs/)
- [Serviço meteorológico islandês, Leirvogur](https://en.vedur.is/weather/articles/nr/2549)
- [Condições de acesso aos dados TGO](https://flux.phys.uit.no/div/DataAccess.html), cujos dados numéricos não foram integrados
- [Open-Meteo Geocoding / GeoNames](https://open-meteo.com/en/docs/geocoding-api)

### Verificação e publicação

`npm test` verifica separação regional, direções do oval, luz solar, horários e rejeição de dados magnéticos atrasados. `npm run build` gera o site de produção. `npm run dev` também serve as APIs de magnetômetros e HUXt para a prévia local. As duas rotas `/local` e `/local/` têm encaminhamento explícito em `vercel.json`.

Nenhuma credencial ou nova assinatura é necessária para esta alteração. As consultas meteorológicas continuam usando o provedor já existente. A disponibilidade e os termos dos provedores continuam se aplicando.

## Diário pessoal de observações

O diário que registra aurora vista em Överkalix é uma ferramenta pessoal. Ele não aparece no site público e não envia registros para terceiros.

Para usá-lo no seu computador:

1. Abra este repositório no Terminal.
2. Execute `npm install` apenas na primeira vez.
3. Execute `npm run journal`.
4. O navegador abrirá o endereço local, normalmente `http://127.0.0.1:5173`.

Deixe a janela do Terminal aberta enquanto estiver registrando as observações. Para encerrar, use `Ctrl + C` nessa janela.

Os dados ficam apenas no perfil deste navegador. Use o botão **Exportar JSON** regularmente para manter uma cópia permanente. Uma futura versão com histórico compartilhado e gráficos deve usar banco de dados com autenticação, nunca um formulário público.
