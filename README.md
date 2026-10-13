# Rota Clara — aplicativo mobile

Aplicativo **React Native + Expo + TypeScript**, para Android e iOS, com as sete telas da referência visual. A entrada do aplicativo é `index.js`; as telas estão em `App.tsx`, os componentes em `src/ui.tsx` e a navegação em `src/navigation.ts`.

## Visualizar no computador

No terminal desta pasta, execute `npm.cmd run web`. O Expo abrirá o aplicativo no navegador; se não abrir, acesse o endereço Local mostrado no terminal (normalmente `http://localhost:8081`). Para simular o tamanho de um celular, pressione F12 no navegador e ative o modo de dispositivo. Encerre o servidor com Ctrl+C.

Essa visualização executa `App.tsx` com React Native Web. Abrir `index.html` diretamente mostra apenas a referência web anterior.

## Executar no celular

As dependências já foram instaladas. Na pasta do projeto, execute:

```powershell
npm.cmd start
```

Instale o **Expo Go** compatível com o SDK 57 e leia o QR code exibido pelo terminal. Computador e celular devem estar na mesma rede Wi-Fi. No iPhone, use a câmera para abrir o QR code; se solicitado pelo Expo Go, entre com a mesma conta Expo no computador (`npx.cmd expo login`) e no celular.

Para reinstalar as dependências em outro computador:

```powershell
npm.cmd ci
```

Em um emulador Android configurado, use `npm.cmd run android`. O simulador iOS requer macOS e Xcode; use `npm run ios` no Mac. No Windows, é possível testar no iPhone físico usando Expo Go.

Referências: [iniciar o Expo](https://docs.expo.dev/get-started/start-developing/) e [configurar o ambiente](https://docs.expo.dev/get-started/set-up-your-environment/).

## Funcionalidades

- Busca com validação de origem e destino e três opções de rota.
- Comparação de alternativa, acompanhamento de etapas, atraso e falha de localização.
- Navegação inferior, botão Voltar e suporte ao botão físico Voltar do Android.
- Viagem salva localmente com AsyncStorage e restaurada ao reabrir o aplicativo.
- Áreas seguras para notch e gestos, rolagem, tratamento do teclado, alvos de toque e rótulos para leitores de tela.
- Modais nativos de mapa esquemático, etapas, comparação e ajuda.

Os trajetos, preços, horários, mapa e falha de localização são demonstrativos. Não há backend, GPS ou integração com transporte público. O acesso ao Figma estava limitado; a referência usada foi a imagem enviada.

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd test
npx.cmd expo install --check
npx.cmd expo export --platform all
```

A exportação verifica a geração dos bundles Android e iOS; não gera APK/IPA nem substitui o teste no dispositivo.

A auditoria do npm identificou 22 avisos em dependências da cadeia Expo/React Native (7 moderados e 15 altos). As correções propostas incluem trocar o Expo 57 por Expo 44 e React Native por 0.72, incompatíveis com este projeto; não foi aplicado `npm audit fix --force`. Consulte `npm.cmd audit` antes de preparar uma distribuição de produção.

## Referência web anterior

`index.html`, `styles.css`, `app.js` e `verify.cjs` preservam a versão web anterior para comparação. O Expo executa a aplicação nativa em `App.tsx`, independentemente desses arquivos. A aplicação mobile não utiliza WebView.
