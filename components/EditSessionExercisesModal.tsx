// components/ui/EditSessionExercisesModal.tsx
import { supabase } from '@/lib/supabase';
import { AntDesign } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

type SessionExerciseRow = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  rest_time: number | null;
  position: number;
};

type Props = {
  visible: boolean;
  sessionId: string | null;
  sessionName: string;
  onClose: () => void;
  onSaved?: () => void;
};

export default function EditSessionExercisesModal({
  visible,
  sessionId,
  sessionName,
  onClose,
  onSaved,
}: Props) {
  const [sessionExercises, setSessionExercises] = useState<SessionExerciseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !sessionId) return;

    let mounted = true;

    const fetchExercises = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('session_exercises')
          .select(`
            id,
            exercise_id,
            sets,
            reps,
            weight,
            rest_time,
            position,
            exercises:exercises (
              name
            )
          `)
          .eq('session_id', sessionId)
          .order('position', { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        const mapped: SessionExerciseRow[] = (data ?? []).map((row: any) => ({
          id: row.id,
          exercise_id: row.exercise_id,
          exercise_name: row.exercises?.name ?? 'Ejercicio',
          sets: row.sets,
          reps: row.reps,
          weight: row.weight,
          rest_time: row.rest_time,
          position: row.position,
        }));

        setSessionExercises(mapped);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudieron cargar los ejercicios de la sesión.');
        onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchExercises();
    return () => {
      mounted = false;
    };
  }, [visible, sessionId, onClose]);

  const updateExerciseField = (
    id: string,
    field: keyof SessionExerciseRow,
    value: string,
  ) => {
    setSessionExercises((prev) =>
      prev.map((ex) =>
        ex.id === id
          ? {
            ...ex,
            [field]:
              field === 'sets' ||
                field === 'reps' ||
                field === 'rest_time'
                ? value === '' ? null : Number(value)
                : field === 'weight'
                  ? value === '' ? null : Number(value)
                  : value,
          }
          : ex,
      ),
    );
  };

  const handleDragEnd = ({ data }: { data: SessionExerciseRow[] }) => {
    const reordered = data.map((ex, idx) => ({ ...ex, position: idx }));
    setSessionExercises(reordered);
  };

  const handleSave = async () => {
    if (!sessionId) return;

    try {
      setSaving(true);

      const payload = sessionExercises.map((ex) => ({
        id: ex.id,
        session_id: sessionId,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        rest_time: ex.rest_time,
        position: ex.position,
      }));

      const { error } = await supabase
        .from('session_exercises')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      Alert.alert('Guardado', 'Ejercicios actualizados.');
      onClose();
      onSaved?.();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestClose = () => {
    if (saving) return;
    onClose();
  };

  // Compact loading state
  if (loading && !sessionExercises.length) {
    return (
      <Modal visible={visible} transparent onRequestClose={handleRequestClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ActivityIndicator size="large" color="#F34E3A" />
          </View>
        </View>
      </Modal>
    );
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<SessionExerciseRow>) => {
    // índice visual usando position o buscando la posición en el array
    const displayIndex =
      typeof item.position === 'number'
        ? item.position + 1
        : 1;
    return (
      <View
        style={[
          styles.exerciseItem,
          isActive && styles.exerciseItemActive,
        ]}
      >
        <View style={styles.exerciseHeaderRow}>
          <Text style={styles.exerciseIndex}>{displayIndex}</Text>
          <Text style={styles.exerciseName}>{item.exercise_name}</Text>
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={styles.dragHandle}
          >
            <MaterialCommunityIcons
              name="drag-vertical"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.fieldsBlock}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Series</Text>
            <TextInput
              style={styles.labeledInput}
              placeholder="4"
              placeholderTextColor="#9aa0a6"
              keyboardType="number-pad"
              value={item.sets != null ? String(item.sets) : ''}
              onChangeText={(t) => updateExerciseField(item.id, 'sets', t)}
              returnKeyType="done"
            />
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Repes</Text>
            <TextInput
              style={styles.labeledInput}
              placeholder="12"
              placeholderTextColor="#9aa0a6"
              keyboardType="number-pad"
              value={item.reps != null ? String(item.reps) : ''}
              onChangeText={(t) => updateExerciseField(item.id, 'reps', t)}
              returnKeyType="done"
            />
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.labeledInput}
              placeholder="30.5"
              placeholderTextColor="#9aa0a6"
              keyboardType="decimal-pad"
              value={item.weight != null ? String(item.weight) : ''}
              onChangeText={(t) => updateExerciseField(item.id, 'weight', t)}
              returnKeyType="done"
            />
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Descanso (s)</Text>
            <TextInput
              style={styles.labeledInput}
              placeholder="90"
              placeholderTextColor="#9aa0a6"
              keyboardType="number-pad"
              value={item.rest_time != null ? String(item.rest_time) : ''}
              onChangeText={(t) => updateExerciseField(item.id, 'rest_time', t)}
              returnKeyType="done"
            />
          </View>
        </View>
      </View>
    );
  };


  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleRequestClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar sesión</Text>
            <TouchableOpacity onPress={handleRequestClose}>
              <AntDesign name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>{sessionName}</Text>
          <Text style={styles.reorderHint}>
            Mantén presionado el icono para reordenar
          </Text>

          {/* Lista arrastrable */}
          {sessionExercises.length === 0 ? (
            <Text style={styles.emptyText}>
              Esta sesión aún no tiene ejercicios.
            </Text>
          ) : (
            <DraggableFlatList
              data={sessionExercises}
              keyExtractor={(item) => item.id}
              onDragEnd={handleDragEnd}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.submitButton, styles.cancelButton]}
              onPress={handleRequestClose}
              disabled={saving}
            >
              <Text style={styles.submitButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSave}
              disabled={saving || !sessionExercises.length}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="content-save-outline"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={[styles.submitButtonText, { marginLeft: 6 }]}>
                    Guardar
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    height: '80%',
    backgroundColor: '#242424',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: '#9aa0a6',
    fontSize: 13,
    marginBottom: 4,
  },
  reorderHint: {
    color: '#b3b3b3',
    fontSize: 12,
    marginBottom: 8,
  },
  exerciseList: {
    marginVertical: 10,
  },
  exerciseItem: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  exerciseItemActive: {
    backgroundColor: '#3d3d3d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseIndex: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  exerciseName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dragHandle: {
    padding: 4,
    marginLeft: 8,
  },
  fieldsBlock: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 10,
    backgroundColor: '#2b2b2b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },
  label: {
    color: '#e6e6e6',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  labeledInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  emptyText: {
    color: '#9aa0a6',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#F34E3A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
