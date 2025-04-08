import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { moods } from '../services/moods';
import { Stack, useRouter } from 'expo-router';

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

const moodIcons: Record<string, string> = {
  'happy': 'emoticon-happy-outline',
  'excited': 'emoticon-excited-outline',
  'neutral': 'emoticon-neutral-outline',
  'sad': 'emoticon-sad-outline',
  'angry': 'emoticon-angry-outline',
  'tired': 'sleep',
  'sick': 'emoticon-sick-outline',
  'anxious': 'head-sync',
};

const moodColors: Record<string, string> = {
  'happy': '#FFD700',
  'excited': '#FF69B4',
  'neutral': '#B0C4DE',
  'sad': '#87CEEB',
  'angry': '#FF6B6B',
  'tired': '#DDA0DD',
  'sick': '#98FB98',
  'anxious': '#F0E68C',
};

export default function MoodsScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [monthMoods, setMonthMoods] = useState<Record<string, any[]>>({});
  const [moodStats, setMoodStats] = useState<{
    daily: Record<string, number>;
    monthly: Record<string, number>;
  }>({ daily: {}, monthly: {} });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMonthMoods();
  }, [selectedMonth]);

  useEffect(() => {
    calculateStats();
  }, [selectedDay, monthMoods]);

  const loadMonthMoods = async () => {
    setIsLoading(true);
    try {
      const monthString = format(selectedMonth, 'yyyy-MM');
      const response = await moods.getAll(monthString);
      setMonthMoods(response);
      setSelectedDay(null);
    } catch (error) {
      console.error('Error al cargar los estados de ánimo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const monthlyStats: Record<string, number> = {};
    let totalDaysWithMoods = 0;
    
    // Calcular estadísticas mensuales
    Object.entries(monthMoods).forEach(([date, moods]) => {
      if (moods.length > 0) {
        totalDaysWithMoods++;
        // Contar la frecuencia de cada estado de ánimo por día
        const dailyMoodCounts: Record<string, number> = {};
        moods.forEach(mood => {
          dailyMoodCounts[mood.mood] = (dailyMoodCounts[mood.mood] || 0) + 1;
        });
        // Usar el estado de ánimo más frecuente del día
        const mostFrequentMood = Object.entries(dailyMoodCounts)
          .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        monthlyStats[mostFrequentMood] = (monthlyStats[mostFrequentMood] || 0) + 1;
      }
    });

    // Calcular estadísticas diarias si hay un día seleccionado
    let dailyStats: Record<string, number> = {};
    if (selectedDay) {
      const dateKey = format(selectedDay, 'yyyy-MM-dd');
      const dayMoods = monthMoods[dateKey] || [];
      dayMoods.forEach(mood => {
        dailyStats[mood.mood] = (dailyStats[mood.mood] || 0) + 1;
      });
    }

    setMoodStats({
      monthly: monthlyStats,
      daily: dailyStats
    });
  };

  const renderCalendar = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    const startWeekday = getDay(start);
    const calendar = [...Array(startWeekday).fill(null), ...days];

    const moodsByDate: Record<string, string> = {};
    Object.entries(monthMoods).forEach(([date, moods]) => {
      if (moods.length > 0) {
        // Usar el último estado de ánimo del día para el calendario
        moodsByDate[date] = moods[moods.length - 1].mood;
      }
    });

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, index) => (
            <Text key={index} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {calendar.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.emptyDay} />;
            }

            const dateString = format(day, 'yyyy-MM-dd');
            const mood = moodsByDate[dateString];
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;
            const isSelected = selectedDay && format(selectedDay, 'yyyy-MM-dd') === dateString;

            return (
              <TouchableOpacity
                key={dateString}
                style={[
                  styles.dayContainer,
                  isToday && styles.today,
                  isSelected && styles.selectedDay,
                  mood && { backgroundColor: moodColors[mood] }
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayText, mood && styles.dayTextWithMood]}>
                  {format(day, 'd')}
                </Text>
                {mood && (
                  <MaterialCommunityIcons
                    name={moodIcons[mood] as any}
                    size={16}
                    color="#202024"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMoodStats = () => {
    const stats = selectedDay ? moodStats.daily : moodStats.monthly;
    const totalMoods = Object.values(stats).reduce((a, b) => a + b, 0);
    
    if (totalMoods === 0) {
      return (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>
            {selectedDay 
              ? `Estados de ánimo del ${format(selectedDay, 'd MMMM', { locale: es })}`
              : 'Promedio mensual'}
          </Text>
          <Text style={styles.noDataText}>
            {selectedDay 
              ? 'No hay registros para este día'
              : 'No hay registros para este mes'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>
          {selectedDay 
            ? `Estados de ánimo del ${format(selectedDay, 'd MMMM', { locale: es })}`
            : 'Promedio mensual'}
        </Text>
        {Object.entries(stats).map(([mood, count]) => (
          <View key={mood} style={styles.statRow}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons
                name={moodIcons[mood] as any}
                size={24}
                color="#202024"
              />
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${(count / totalMoods) * 100}%`,
                    backgroundColor: moodColors[mood]
                  }
                ]} 
              />
            </View>
            <Text style={styles.statPercentage}>
              {Math.round((count / totalMoods) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color="#8b5cf6" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estados de ánimo</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedMonth(newDate);
            }}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#202024" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(selectedMonth, 'MMMM yyyy', { locale: es })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedMonth(newDate);
            }}
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color="#202024" />
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons 
              name="loading" 
              size={32} 
              color="#8b5cf6" 
              style={styles.loadingIcon} 
            />
            <Text style={styles.loadingText}>Cargando estados de ánimo...</Text>
          </View>
        ) : (
          <>
            {renderCalendar()}
            {renderMoodStats()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202024',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  content: {
    flex: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202024',
    textTransform: 'capitalize',
  },
  calendarContainer: {
    backgroundColor: '#f7f5f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  today: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  dayText: {
    fontSize: 12,
    color: '#202024',
  },
  dayTextWithMood: {
    marginBottom: 2,
  },
  statsContainer: {
    backgroundColor: '#f7f5f2',
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202024',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statPercentage: {
    width: 40,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingIcon: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  selectedDay: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
}); 