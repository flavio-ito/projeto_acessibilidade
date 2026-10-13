import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

export const colors = { purple: '#6851a5', accent: '#7b5bbe', text: '#53505a', light: '#f2ecf7', border: '#d9d1e3', yellow: '#fff0c9', warning: '#68552b' };
type IconName = 'bus' | 'home' | 'help' | 'clock' | 'back';
export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" accessible={false}>
    {name === 'bus' && <><Rect x={5} y={3} width={14} height={16} rx={3}/><Path d="M5 10h14M9 4v5m6-5v5M8 19v2m8-2v2"/><Circle cx={8.5} cy={15} r={0.8}/><Circle cx={15.5} cy={15} r={0.8}/></>}
    {name === 'home' && <Path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>}
    {name === 'help' && <><Circle cx={12} cy={12} r={9}/><Path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/></>}
    {name === 'clock' && <><Circle cx={12} cy={12} r={9}/><Path d="M12 6v6l4 2"/></>}
    {name === 'back' && <Path d="m14 5-7 7 7 7M7 12h14"/>}
  </Svg>;
}
export function Button({ children, onPress, primary = false, disabled = false }: { children: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, primary && ui.primary, (pressed || disabled) && { opacity: 0.65 }]}>
    <Text style={[ui.buttonText, primary && { color: 'white' }]}>{children}</Text>
  </Pressable>;
}
export function Card({ title, children, tone = 'plain' }: { title: string; children: ReactNode; tone?: 'plain' | 'tinted' | 'warning' }) {
  return <View style={[ui.card, tone === 'tinted' && ui.tinted, tone === 'warning' && ui.warning]}>
    <Text style={[ui.cardTitle, tone === 'warning' && { color: colors.warning }]}>{title}</Text>
    {typeof children === 'string' ? <Text style={[ui.body, tone === 'warning' && { color: colors.warning }]}>{children}</Text> : children}
  </View>;
}
export function RouteMap() {
  return <View accessible accessibilityLabel="Esquema do trajeto: você, ponto Avenida Central e ônibus" style={ui.map}>
    <Svg width="100%" height={113} viewBox="0 0 340 113" accessible={false}>
      <Path fill="#f0edf5" d="M0 0h100v19H0zm118 0h114v19H118zm133 0h89v19h-89zM0 37h100v22H0zm118 0h114v22H118zm133 0h89v22h-89zM0 76h100v37H0zm118 0h114v37H118zm133 0h89v37h-89z"/>
      <Path d="M47 85h132V33h101" fill="none" stroke="#7352b1" strokeWidth={5} strokeLinejoin="round"/>
      <Ellipse cx={47} cy={85} rx={8} ry={4} fill="#7352b1"/><Ellipse cx={179} cy={33} rx={8} ry={4} fill="white" stroke="#7352b1" strokeWidth={3}/>
      <Rect x={270} y={27} width={22} height={13} rx={4} fill={colors.purple}/>
    </Svg>
  </View>;
}
export const ui = StyleSheet.create({
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  button: { minHeight: 48, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: '#8d70d0', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primary: { backgroundColor: colors.purple, borderColor: colors.purple },
  buttonText: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: colors.accent, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 16, lineHeight: 23, color: colors.text, fontWeight: '700', marginBottom: 8 },
  tinted: { backgroundColor: colors.light, borderColor: colors.light },
  warning: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  map: { marginTop: 0, marginBottom: 8, height: 113 },
});
