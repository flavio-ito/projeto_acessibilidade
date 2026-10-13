export type Screen = 'home' | 'routes' | 'trip' | 'alternative' | 'journey' | 'delay' | 'location';
export type AppState = {
  screen: Screen;
  history: Screen[];
  origin: string;
  destination: string;
  selectedRoute: number;
  started: boolean;
};
export type Action =
  | { type: 'navigate'; screen: Screen }
  | { type: 'back' }
  | { type: 'search'; origin: string; destination: string }
  | { type: 'select'; route: number }
  | { type: 'alternative' }
  | { type: 'start' }
  | { type: 'restore'; state: AppState };

export const initialState: AppState = {
  screen: 'home', history: [], origin: 'Avenida Central, 125',
  destination: 'Museu da Cidade', selectedRoute: 0, started: false,
};
const screenNames: Screen[] = ['home', 'routes', 'trip', 'alternative', 'journey', 'delay', 'location'];
export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const state = value as AppState;
  return screenNames.includes(state.screen) && Array.isArray(state.history)
    && state.history.every(screen => screenNames.includes(screen))
    && typeof state.origin === 'string' && !!state.origin.trim()
    && typeof state.destination === 'string' && !!state.destination.trim()
    && Number.isInteger(state.selectedRoute) && state.selectedRoute >= 0 && state.selectedRoute <= 3
    && typeof state.started === 'boolean';
}
function navigate(state: AppState, screen: Screen): AppState {
  if (screen === state.screen) return state;
  return { ...state, screen, history: screen === 'home' ? [] : [...state.history, state.screen] };
}
export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'restore': return isAppState(action.state) ? action.state : state;
    case 'navigate': return navigate(state, action.screen);
    case 'back': return state.history.length
      ? { ...state, screen: state.history[state.history.length - 1], history: state.history.slice(0, -1) }
      : state;
    case 'search': return action.origin.trim() && action.destination.trim()
      ? { ...state, screen: 'routes', history: ['home'], origin: action.origin.trim(), destination: action.destination.trim(), started: false }
      : state;
    case 'select': return action.route >= 0 && action.route <= 2 && Number.isInteger(action.route)
      ? navigate({ ...state, selectedRoute: action.route, started: false }, 'trip') : state;
    case 'alternative': return navigate({ ...state, selectedRoute: 3 }, 'journey');
    case 'start': return navigate({ ...state, started: true }, 'delay');
  }
}

export const routeOptions = [
  { name: 'Mais rápida', minutes: 35, changes: 1, walk: 450, bus: '32', approach: 350 },
  { name: 'Menos caminhada', minutes: 39, changes: 2, walk: 150, bus: '32', approach: 50 },
  { name: 'Sem baldeação', minutes: 43, changes: 0, walk: 600, bus: '32', approach: 500 },
  { name: 'Alternativa', minutes: 36, changes: 1, walk: 550, bus: '27', approach: 450 },
];
export function journeySteps(state: AppState): string[] {
  const route = routeOptions[state.selectedRoute];
  const steps = ['Caminhada atual', `Ônibus ${route.bus} → Praça Central`];
  if (route.changes > 1) steps.push('Ônibus 18 → Estação Central');
  if (route.changes > 0) steps.push('Metrô – Linha Azul, plataforma B12');
  steps.push(`Caminhada de 100 m até ${state.destination}`);
  return steps;
}
