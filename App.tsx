import React, { useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appReducer, initialState, isAppState, journeySteps, routeOptions, Screen } from './src/navigation';
import { Button, Card, colors, Icon, RouteMap, ui } from './src/ui';

type Dialog = 'map' | 'steps' | 'help' | 'compare' | 'other' | 'retry' | null;
const storageKey = '@rota-clara/journey-v1';

function RotaClara() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [ready, setReady] = useState(false);
  const [origin, setOrigin] = useState(initialState.origin);
  const [destination, setDestination] = useState(initialState.destination);
  const [dialog, setDialog] = useState<Dialog>(null);
  const scroll = useRef<ScrollView>(null);
  const destinationInput = useRef<TextInput>(null);
  const pendingSave = useRef(Promise.resolve());
  const route = routeOptions[state.selectedRoute];
  const go = (screen: Screen) => { setDialog(null); Keyboard.dismiss(); dispatch({ type: 'navigate', screen }); };
  const chooseAlternative = () => { setDialog(null); dispatch({ type: 'alternative' }); };

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!active || !raw) return;
      const saved: unknown = JSON.parse(raw);
      if (isAppState(saved)) {
        dispatch({ type: 'restore', state: saved });
        setOrigin(saved.origin); setDestination(saved.destination);
      }
    }).catch(() => { /* A missing or corrupt saved trip falls back to the initial screen. */ })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Serialize writes so rapid screen changes never overwrite the newest saved trip.
    pendingSave.current = pendingSave.current.then(() => AsyncStorage.setItem(storageKey, JSON.stringify(state))).catch(() => {});
  }, [state, ready]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [state.screen]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dialog) { setDialog(null); return true; }
      if (state.history.length) { dispatch({ type: 'back' }); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [dialog, state.history]);

  function search() {
    if (!origin.trim() || !destination.trim()) { Alert.alert('Informe o trajeto', 'Preencha sua localização e o destino.'); return; }
    Keyboard.dismiss(); dispatch({ type: 'search', origin, destination });
  }
  const heading = (title: string, intro?: string, large = false) => <><Text accessibilityRole="header" style={[styles.title, large && styles.homeTitle]}>{title}</Text>{intro && <Text style={styles.intro}>{intro}</Text>}</>;
  const tripHeading = () => heading('Sua viagem', `Destino: ${state.destination}`);
  const steps = journeySteps(state);
  let content: React.ReactNode;
  switch (state.screen) {
    case 'home': content = <>
      {heading('Para onde você vai?', 'Informe o destino para consultar\nsuas opções de transporte.', true)}
      <View style={styles.form}>
        <View style={styles.field}><Text nativeID="origin-label" style={styles.fieldLabel}>Sua localização</Text><TextInput accessibilityLabel="Sua localização" accessibilityLabelledBy="origin-label" value={origin} onChangeText={setOrigin} placeholder="Informe seu endereço" style={styles.input} returnKeyType="next" onSubmitEditing={() => destinationInput.current?.focus()} autoComplete="street-address" /></View>
        <View style={styles.field}><Text nativeID="destination-label" style={styles.fieldLabel}>Destino</Text><TextInput ref={destinationInput} accessibilityLabel="Destino" accessibilityLabelledBy="destination-label" value={destination} onChangeText={setDestination} placeholder="Para onde você vai?" style={styles.input} returnKeyType="search" onSubmitEditing={search}/></View>
        <View style={styles.departure}><Icon name="clock"/><Text style={styles.tip}>Saída: agora</Text></View>
        <Button primary onPress={search}>Buscar rotas</Button>
      </View>
      <Text style={[styles.tip, styles.bold]}>Compare antes de escolher</Text><Text style={styles.tip}>Veja o tempo, as baldeações e a caminhada de cada rota.</Text>
    </>; break;
    case 'routes': content = <>
      {heading('Escolha sua rota', 'Compare tempo, baldeações e caminhada.')}
      {routeOptions.slice(0, 3).map((option, index) => <View key={option.name} style={ui.card}>
        <View style={styles.routeHeading}><Text style={[ui.cardTitle, styles.routeName]}>{option.name}</Text><Text style={styles.duration}>{option.minutes} min</Text></View>
        <Text style={[ui.body, styles.routeDetail]}>{option.changes} {option.changes === 1 ? 'baldeação' : 'baldeações'} • {option.walk} m a pé • R$ 5,00</Text>
        <Button primary onPress={() => dispatch({ type: 'select', route: index })}>Escolher esta rota</Button>
      </View>)}
      <Button onPress={() => setDialog('other')}>Ver outras rotas</Button>
    </>; break;
    case 'trip': content = <>
      {tripHeading()}<Text style={styles.eyebrow}>PRÓXIMA AÇÃO</Text>
      <Card title={`Pegue o ônibus ${route.bus} – Centro`} tone="tinted">{'Chegada ao ponto em 4 min.\nEspere no ponto Avenida Central.'}</Card>
      <RouteMap/><Text style={styles.mapLabel}>Você – ponto Avenida Central – ônibus</Text>
      <Card title="O ônibus acumula 18 min de atraso" tone="warning">{'A previsão de chegada ao ponto é 4 min.\nVocê pode manter ou comparar a rota.'}</Card>
      <Button primary onPress={() => go('alternative')}>Ver alternativa</Button><Button onPress={() => go('journey')}>Manter rota atual</Button><Button onPress={() => go('delay')}>Mais informações</Button>
    </>; break;
    case 'alternative': content = <>
      {heading('Atraso na sua viagem', 'Você decide se quer mudar de rota.')}
      <Card title={`Ônibus ${route.bus}: atraso de 18 min`} tone="warning">{'A chegada ao ponto continua prevista\nem aproximadamente 4 min.'}</Card>
      <Card title="Sua rota atual • chegada às 15:48">{`Ônibus ${route.bus}${route.changes ? ' → metrô' : ''} → caminhada\n${route.changes} ${route.changes === 1 ? 'baldeação' : 'baldeações'} • ${route.walk} m a pé`}</Card>
      <Card title="Alternativa • chegada às 15:36" tone="tinted">{'Ônibus 27 → metrô → caminhada\n1 baldeação • 550 m a pé'}</Card>
      <Text style={styles.question}>O que você quer fazer?</Text><Button primary onPress={chooseAlternative}>Usar nova rota</Button><Button onPress={() => go('journey')}>Manter rota atual</Button><Button onPress={() => setDialog('compare')}>Comparar as duas rotas</Button>
    </>; break;
    case 'journey': content = <>
      {tripHeading()}<Text style={styles.eyebrow}>ETAPA 1 DE {steps.length}</Text>
      <Card title="Agora: caminhe até o ponto" tone="tinted">{`Ponto Avenida Central\n${route.approach} m • aproximadamente ${Math.max(1, Math.round(route.approach / 90))} min`}</Card>
      <Button onPress={() => setDialog('map')}>Ver o ponto no mapa</Button>
      <Card title={`Depois: ônibus ${route.bus} – Centro`}>{'Embarque no ponto Avenida Central.\nDesça na Praça Central após 6 paradas.'}</Card>
      <View style={styles.steps}>{steps.map((step, index) => <Text key={step} style={ui.body}>{index + 1}. {step}</Text>)}</View>
      <Button onPress={() => setDialog('steps')}>Ver todas as etapas</Button><Button primary onPress={() => dispatch({ type: 'start' })}>{state.started ? 'Viagem iniciada · acompanhar' : 'Iniciar viagem'}</Button>
    </>; break;
    case 'delay': content = <>
      {heading(`O ônibus ${route.bus}\nestá atrasado`, 'O que aconteceu e como continuar')}
      <Card title="Atraso registrado: 18 min" tone="warning">{'O ônibus está atrás do horário previsto.\nA chegada ao ponto é estimada em 4 min.'}</Card>
      <Card title="Sua rota continua disponível">{`Você pode esperar pelo ônibus ${route.bus}\nou consultar outra rota.`}</Card>
      <Text style={[styles.tip, styles.marginBottom]}>{'Nenhuma rota foi alterada\nsem sua escolha.'}</Text>
      <Button primary onPress={() => go('journey')}>Continuar esperando</Button><Button onPress={() => go('alternative')}>Ver outra rota</Button>
      <Pressable accessibilityRole="button" onPress={() => go('location')} style={styles.textButton}><Text style={styles.textButtonLabel}>Atualizar localização</Text></Pressable>
    </>; break;
    case 'location': content = <>
      {heading('Falha de localização', 'Sua viagem continua salva.')}
      <Card title={'Não foi possível atualizar\nsua localização'} tone="warning">{'Verifique a conexão com a internet\ne tente novamente.'}</Card>
      <Card title="Rota salva no aplicativo" tone="tinted">{`Ônibus ${route.bus}${route.changes ? ' → Linha Azul' : ''} → caminhada\nDestino: ${state.destination}`}</Card>
      <Button primary onPress={() => setDialog('retry')}>Tentar novamente</Button><Button onPress={() => go('journey')}>Continuar sem localização</Button><Button onPress={() => setDialog('help')}>Preciso de ajuda</Button>
      <Text style={ui.body}>{'Sem localização em tempo real,\nconfirme o ponto e a etapa da viagem\npelas placas e pelo trajeto salvo.'}</Text>
    </>; break;
  }
  if (!ready) return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.purple} size="large" accessibilityLabel="Carregando viagem"/></SafeAreaView>;
  const homeActive = state.screen === 'home' || state.screen === 'routes';
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <StatusBar style="dark"/>
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={styles.brand}><View style={styles.brandIcon}><Icon name="bus" color="#29262e"/></View><Text style={styles.brandText}>Rota Clara</Text></View>
        {!!state.history.length && <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => dispatch({ type: 'back' })} style={styles.back}><Icon name="back"/></Pressable>}
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{content}</ScrollView>
      </KeyboardAvoidingView>
      <SafeAreaView edges={['bottom']} style={styles.navSafe}>
        <View style={styles.nav}>
          {([{ name: 'Início', icon: 'home', active: homeActive, press: () => go('home') }, { name: 'Viagens', icon: 'bus', active: !homeActive, press: () => go('journey') }, { name: 'Ajuda', icon: 'help', active: false, press: () => setDialog('help') }] as const).map(item => <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{ selected: item.active }} onPress={item.press} style={styles.navButton}>
            <View style={[styles.navIcon, item.active && styles.navSelected]}><Icon name={item.icon}/></View><Text style={styles.navText}>{item.name}</Text>
          </Pressable>)}
        </View>
      </SafeAreaView>
    </View>
    <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
      <View style={styles.overlay}><SafeAreaView style={styles.modalSafe}>
        <View accessibilityViewIsModal style={styles.modalCard}><ScrollView contentContainerStyle={styles.modalContent}>
          {dialog === 'map' && <>{heading('Ponto Avenida Central')}<RouteMap/><Text style={ui.body}>Saia de {state.origin} e siga pela Avenida Central até o ponto. Caminhada de {route.approach} m.</Text><Text style={styles.mapLabel}>Mapa esquemático do protótipo.</Text></>}
          {dialog === 'steps' && <>{heading('Etapas da viagem')}{steps.map((step, index) => <Text key={step} style={[ui.body, styles.marginBottom]}>{index + 1}. {step}</Text>)}</>}
          {dialog === 'help' && <>{heading('Como podemos ajudar?')}<Text style={[ui.body, styles.marginBottom]}>Escolha uma rota e acompanhe as instruções em “Viagens”. Se o ônibus atrasar, compare uma alternativa antes de mudar.</Text><Text style={ui.body}>Sem localização, siga as placas e as etapas salvas. Horários, trajetos e localização neste aplicativo são demonstrativos.</Text></>}
          {dialog === 'compare' && <>{heading('Compare as duas rotas')}<Card title="Rota atual · 15:48">{`Ônibus ${route.bus} • ${route.changes} baldeações • ${route.walk} m a pé`}</Card><Card title="Alternativa · 15:36" tone="tinted">Ônibus 27 • 1 baldeação • 550 m a pé</Card><Button primary onPress={chooseAlternative}>Usar nova rota</Button><Button onPress={() => go('journey')}>Manter rota atual</Button></>}
          {dialog === 'other' && <>{heading('Rotas disponíveis')}<Text style={ui.body}>Estas são as três opções disponíveis para este destino no protótipo. Compare o tempo, as baldeações e a caminhada antes de escolher.</Text></>}
          {dialog === 'retry' && <>{heading('Localização indisponível')}<Text style={[ui.body, styles.marginBottom]}>Este protótipo não está conectado a um serviço de localização. Sua rota permanece salva e você pode continuar pelas etapas da viagem.</Text><Button onPress={() => go('journey')}>Continuar sem localização</Button></>}
        </ScrollView><View style={styles.modalFooter}><Button primary onPress={() => setDialog(null)}>Fechar</Button></View></View>
      </SafeAreaView></View>
    </Modal>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><RotaClara/></SafeAreaProvider>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' }, flex: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.light, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 20, fontWeight: '700', color: colors.accent },
  back: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 },
  title: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5, marginBottom: 12 },
  homeTitle: { fontSize: 29, lineHeight: 36 }, intro: { fontSize: 14, lineHeight: 21, color: colors.text, marginBottom: 14 },
  form: { marginTop: 14, marginBottom: 14 }, field: { marginBottom: 24, borderWidth: 1, borderColor: '#958c9f', borderRadius: 3 },
  fieldLabel: { position: 'absolute', left: 10, top: -9, paddingHorizontal: 4, backgroundColor: 'white', fontSize: 12, color: '#746a7e', zIndex: 1 },
  input: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#47434d' },
  departure: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 24 },
  tip: { fontSize: 16, lineHeight: 23, color: colors.text }, bold: { fontWeight: '700', marginBottom: 4 },
  routeHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  routeName: { flex: 1 }, duration: { fontSize: 20, fontWeight: '700', color: colors.accent }, routeDetail: { marginBottom: 10 },
  eyebrow: { fontSize: 14, fontWeight: '700', color: colors.accent, marginBottom: 12 },
  mapLabel: { fontSize: 14, lineHeight: 21, color: '#716b78', marginBottom: 14 },
  question: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  steps: { marginTop: 4, marginBottom: 14 }, marginBottom: { marginBottom: 16 },
  textButton: { minHeight: 48, paddingVertical: 14, paddingHorizontal: 8, alignSelf: 'flex-start' },
  textButtonLabel: { fontSize: 13, fontWeight: '700', color: colors.accent },
  navSafe: { backgroundColor: colors.light }, nav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  navButton: { flex: 1, minHeight: 56, alignItems: 'center', gap: 4 },
  navIcon: { height: 32, width: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navSelected: { backgroundColor: '#e7dcf8' }, navText: { fontSize: 12, color: colors.text },
  overlay: { flex: 1, backgroundColor: '#29213388', justifyContent: 'center', paddingHorizontal: 20 },
  modalSafe: { maxHeight: '95%', width: '100%', maxWidth: 480, alignSelf: 'center' },
  modalCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', flexShrink: 1 },
  modalContent: { padding: 24 }, modalFooter: { paddingHorizontal: 24, paddingBottom: 14 },
});
