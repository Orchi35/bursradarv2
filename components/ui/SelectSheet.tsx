import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';

interface Props {
  open: boolean;
  title: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}

export default function SelectSheet({ open, title, options, value, onSelect, onClose }: Props) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeText}>x</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            {options.map((o) => (
              <TouchableOpacity
                key={o}
                style={[s.option, o === value && s.optionOn]}
                onPress={() => { onSelect(o); onClose(); }}
              >
                <Text style={[s.optionText, o === value && s.optionTextOn]}>{o}</Text>
                {o === value && <Text style={s.check}>✓</Text>}
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', ...SHADOW.md },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: RADIUS.full, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '700' },
  body: { paddingHorizontal: 12, paddingTop: 6 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 12, borderRadius: RADIUS.md, marginBottom: 2 },
  optionOn: { backgroundColor: COLORS.primaryLighter },
  optionText: { fontSize: 14, color: COLORS.textPrimary },
  optionTextOn: { color: COLORS.primaryMid, fontWeight: '600' },
  check: { fontSize: 14, color: COLORS.primaryMid, fontWeight: '700' },
});
