import EditSessionExercisesModal from '@/components/EditSessionExercisesModal';
import Header from '@/components/ui/Header';
import SessionCard from '@/components/ui/SessionCard';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';

interface Session {
  id: string;
  name: string;
  training_type: {
    name: string;
  };
  created_at?: string;
}

const images = [
  require('../../assets/images/home/endurance.png'),
  require('../../assets/images/home/hypertrophy.png'),
  require('../../assets/images/home/strength.png'),
];

const getImageForTrainingType = (trainingTypeName: string): any => {
  const normalizedName = trainingTypeName.toLowerCase().trim();
  switch (normalizedName) {
    case 'resistencia':
      return images[0];
    case 'hipertrofia':
      return images[1];
    case 'fuerza':
      return images[2];
    default:
      return images[1];
  }
};

interface UserProfileRow {
  id: string;
  weight: number | null;
  height: number | null;
}

interface HistoryItem {
  id: string;
  weight: number | null;
  height: number | null;
  created_at: string;
}

export default function Notebook() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');

  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [editSessionName, setEditSessionName] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);

  // History state
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          Alert.alert('Error', 'No estás autenticado');
          router.replace('/Login');
          return;
        }

        // 1) Sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            id,
            name,
            created_at,
            training_type:training_types!inner(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        // 2) User profile (weight/height)
        const { data: profileRow, error: profileError } = await supabase
          .from('users')
          .select('id, weight, height')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!mounted) return;

        if (sessionsData) {
          const transformed = sessionsData.map((session: any) => ({
            ...session,
            training_type: Array.isArray(session.training_type)
              ? session.training_type[0]
              : session.training_type,
          }));
          setSessions(transformed);
        }

        if (profileRow) {
          const p = profileRow as UserProfileRow;
          setProfile(p);
          setWeightInput(p.weight != null ? String(p.weight) : '');
          setHeightInput(p.height != null ? String(p.height) : '');
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudieron cargar datos');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [router]);

  const types = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.training_type?.name) set.add(s.training_type.name);
    });
    return ['Todos', ...Array.from(set)];
  }, [sessions]);

  const sessionsFiltered = useMemo(() => {
    if (selectedType === 'Todos') return sessions;
    return sessions.filter((s) => s.training_type?.name === selectedType);
  }, [sessions, selectedType]);

  const openEditModal = (sessionId: string, sessionName: string) => {
    setEditSessionId(sessionId);
    setEditSessionName(sessionName);
    setEditModalVisible(true);
  };

  const handleDelete = (sessionId: string) => {
    Alert.alert(
      'Eliminar sesión',
      '¿Estás seguro de que quieres eliminar esta sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => confirmDelete(sessionId),
        },
      ],
    );
  };

  const confirmDelete = async (sessionId: string) => {
    try {
      setDeletingId(sessionId);
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo eliminar la sesión');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddSession = () => {
    router.push('/NewSession');
  };

  const parseOptNumber = (s: string) => {
    const trimmed = (s ?? '').trim();
    if (trimmed === '') return null;
    const normalized = trimmed.replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  };

  const handleSaveProfileMetrics = async () => {
    if (!profile) return;
    try {
      setSavingProfile(true);

      const weightVal = parseOptNumber(weightInput);
      const heightVal = parseOptNumber(heightInput);

      if (weightVal === profile.weight && heightVal === profile.height) {
        Alert.alert('Sin cambios', 'No hay cambios para guardar.');
        return;
      }

      const updates = {
        id: profile.id,
        weight: weightVal,
        height: heightVal,
        updated_at: new Date().toISOString(),
      };

      // 1. Update users table
      const { error } = await supabase
        .from('users')
        .update({
          weight: weightVal,
          height: heightVal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      // 2. Insert into history table
      // We do this silently; if it fails, we might just log it or ignore, 
      // but ideally we want it to succeed.
      const { error: historyError } = await supabase
        .from('user_measurements_history')
        .insert({
          user_id: profile.id,
          weight: weightVal,
          height: heightVal,
        });

      if (historyError) {
        console.error('Error saving history:', historyError);
        // Optional: Alert user or just proceed
      }

      setProfile((prev) =>
        prev
          ? {
            ...prev,
            weight: updates.weight,
            height: updates.height,
          }
          : prev,
      );

      Alert.alert('Guardado', 'Peso y altura actualizados.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo actualizar el peso/altura.');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchHistory = async () => {
    if (!profile) return;
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('user_measurements_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistoryData(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryModal = () => {
    setHistoryModalVisible(true);
    fetchHistory();
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const date = new Date(item.created_at).toLocaleDateString();
    return (
      <View style={styles.historyItem}>
        <Text style={styles.historyDate}>{date}</Text>
        <View style={styles.historyValues}>
          <Text style={styles.historyText}>
            Peso: <Text style={styles.historyValue}>{item.weight ?? '—'} kg</Text>
          </Text>
          <Text style={styles.historyText}>
            Altura: <Text style={styles.historyValue}>{item.height ?? '—'} cm</Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <Header title="Libreta" showBackButton={false} />
      <ScrollView style={styles.container}>
        {/* Quick access weight/height */}
        <View style={styles.metricsCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.metricsTitle}>Mis Medidas</Text>
            <TouchableOpacity onPress={openHistoryModal}>
              <Text style={styles.historyLink}>Ver historial</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricField}>
              <Text style={styles.metricLabel}>Peso (kg)</Text>
              <View style={styles.metricInputWrapper}>
                <TextInput
                  style={styles.metricInput}
                  keyboardType="numeric"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  placeholder="—"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>
            <View style={styles.metricField}>
              <Text style={styles.metricLabel}>Altura (cm)</Text>
              <View style={styles.metricInputWrapper}>
                <TextInput
                  style={styles.metricInput}
                  keyboardType="numeric"
                  value={heightInput}
                  onChangeText={setHeightInput}
                  placeholder="—"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.metricSaveButton}
              onPress={handleSaveProfileMetrics}
              disabled={savingProfile}
              activeOpacity={0.7}
            >
              {savingProfile ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialCommunityIcons name="content-save" size={22} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.activityTitle}>Editar Sesiones</Text>
            <Text style={styles.activitySubtitle}> Elige tu sesión 👇 o agrega una sesión 👉</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSession}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus-thick" size={28} color="white" />
          </TouchableOpacity>
        </View>
        {/* Filter chips */}
        <View style={styles.chipsHeaderRow}>
          <Text style={styles.chipsLabel}>Tipo :</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {types.map((type) => {
              const active = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={0.8}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#F34E3A" style={{ marginTop: 40 }} />
        ) : sessionsFiltered.length === 0 ? (
          <Text style={styles.emptyText}>No tienes sesiones aún.</Text>
        ) : (
          <View style={styles.list}>
            {sessionsFiltered.map((session) => (
              <View key={session.id} style={styles.sessionRow}>
                {/* Left: session card / preview */}
                <View style={{ flex: 1 }}>
                  <SessionCard
                    key={session.id}
                    title={session.name}
                    image={getImageForTrainingType(session.training_type.name)}
                    onPress={() => openEditModal(session.id, session.name)}
                    disabled={true}
                    rightActions={
                      <>
                        <TouchableOpacity
                          onPress={() => openEditModal(session.id, session.name)}
                          style={styles.iconButton}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="pencil" size={18} color="#ffffff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(session.id)}
                          style={[styles.iconButton, { backgroundColor: '#7f1d1d', marginLeft: 10 }]}
                          activeOpacity={0.7}
                          disabled={deletingId === session.id}
                        >
                          {deletingId === session.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <MaterialCommunityIcons
                              name="trash-can-outline"
                              size={18}
                              color="#ffffff"
                            />
                          )}
                        </TouchableOpacity>
                      </>
                    }
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <EditSessionExercisesModal
        visible={editModalVisible}
        sessionId={editSessionId}
        sessionName={editSessionName}
        onClose={() => {
          setEditModalVisible(false);
          setEditSessionId(null);
        }}
        onSaved={() => {
          // optional: re-fetch sessions or just leave as is
        }}
      />

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Historial de Medidas</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <ActivityIndicator size="large" color="#F34E3A" style={{ marginTop: 20 }} />
            ) : historyData.length === 0 ? (
              <Text style={styles.emptyText}>No hay historial disponible.</Text>
            ) : (
              <FlatList
                data={historyData}
                keyExtractor={(item) => item.id}
                renderItem={renderHistoryItem}
                contentContainerStyle={styles.historyList}
              />
            )}
          </View>
        </View>
      </Modal>

    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 75,
    backgroundColor: '#141516',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  activitySubtitle: {
    color: 'gray',
    fontSize: 12,
    marginBottom: 15,
    marginTop: 5,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  addButton: {
    height: 46,
    width: 46,
    borderRadius: 23,
    backgroundColor: '#F34E3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  chipsLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  chipsRow: {
    paddingVertical: 0,
    gap: 8,
    // make chips container use remaining horizontal space
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2b2b2b',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#F34E3A',
    borderColor: 'white',
  },
  chipText: {
    color: '#d4d4d4',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: 'white',
  },

  list: {
    marginBottom: 40,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  actionsColumn: {
    marginLeft: 8,
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    color: 'gray',
    marginTop: 40,
    textAlign: 'center',
    fontSize: 14,
  },
  metricsCard: {
    backgroundColor: '#242424',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 40,
  },
  metricsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyLink: {
    color: '#F34E3A',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  metricField: {
    flex: 1,
    marginRight: 8,
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  metricInputWrapper: {
    borderRadius: 8,
    // borderWidth: 1, // Removed border to match modal style preference usually
    // borderColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#333', // Darker background for input
  },
  metricInput: {
    color: 'white',
    fontSize: 14,
    paddingVertical: 2,
  },
  metricSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F34E3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#242424', // Match modal background
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333', // Darker separator
  },
  historyDate: {
    color: '#9ca3af',
    fontSize: 14,
  },
  historyValues: {
    alignItems: 'flex-end',
  },
  historyText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  historyValue: {
    color: 'white',
    fontWeight: '600',
  },

});
