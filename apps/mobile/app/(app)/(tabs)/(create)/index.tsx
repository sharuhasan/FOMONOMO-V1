import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MapPin, Search } from 'lucide-react-native';
import { useCreateActivity } from '../../../../src/api/hooks';
import { DURATION_OPTIONS, DURATION_UNITS, DurationUnit } from '../../../../src/constants/config';

const CATEGORIES = ['Sports', 'Food', 'Study', 'Music', 'Art', 'Social', 'Fitness', 'Gaming'];
const CATEGORY_EMOJI: Record<string, string> = {
  Sports: '⚽', Food: '🍕', Study: '📚', Music: '🎵',
  Art: '🎨', Social: '🎉', Fitness: '💪', Gaming: '🎮',
};

const DEFAULT_REGION: Region = {
  latitude: 37.78,
  longitude: -122.43,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type PlaceSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

export default function CreateScreen() {
  const router = useRouter();
  const createActivity = useCreateActivity();
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Social');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 3600000));
  const [showCreateDatePicker, setShowCreateDatePicker] = useState(false);
  const [showCreateTimePicker, setShowCreateTimePicker] = useState(false);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState('');
  const [customDurationUnit, setCustomDurationUnit] = useState<DurationUnit>(DURATION_UNITS[0]);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  // Get user's current location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const userRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(userRegion);
    })();
  }, []);

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'SpontaneousSocial/1.0' } },
      );
      const data: PlaceSuggestion[] = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleLocationChange = (text: string) => {
    setLocation(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(text), 400);
  };

  const selectSuggestion = (place: PlaceSuggestion) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    // Use a shorter display name
    const parts = place.display_name.split(', ');
    const shortName = parts.slice(0, 3).join(', ');
    setLocation(shortName);
    setPin({ latitude: lat, longitude: lon });
    setSuggestions([]);
    setShowSuggestions(false);
    const newRegion = { latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent.coordinate;
    setPin(coord);
  };

  const handleCreate = async () => {
    if (!title || !location) {
      Alert.alert('Missing fields', 'Title and location are required');
      return;
    }

    const scheduledTime = scheduledDate.toISOString();

    try {
      await createActivity.mutateAsync({
        title,
        description,
        category,
        location,
        lat: pin?.latitude ?? 0,
        lng: pin?.longitude ?? 0,
        scheduledTime,
        maxParticipants: parseInt(maxParticipants) || 10,
        ...(durationMinutes != null && { durationMinutes }),
      });
      Alert.alert('Created!', 'Your activity is live', [
        { text: 'OK', onPress: () => router.push('/(app)/(discover)') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text className="text-2xl font-display text-primary mb-4">Create Activity</Text>

        <Text className="text-sm font-body-bold text-foreground mb-2">Title *</Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          placeholder="e.g. Morning Yoga in the Park"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />

        <Text className="text-sm font-body-bold text-foreground mb-2">Description</Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          placeholder="What's the plan?"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text className="text-sm font-body-bold text-foreground mb-2">Category</Text>
        <View className="flex-row flex-wrap mb-4">
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              className={`mr-2 mb-2 px-3 py-2 rounded-xl ${
                category === cat ? 'bg-primary' : 'bg-card border border-border'
              }`}
            >
              <Text className={category === cat ? 'text-white' : 'text-foreground'}>
                {CATEGORY_EMOJI[cat]} {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm font-body-bold text-foreground mb-2">Location *</Text>
        <View style={{ zIndex: 10 }}>
          <View style={styles.searchBox}>
            <Search size={16} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a place..."
              placeholderTextColor="#999"
              value={location}
              onChangeText={handleLocationChange}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {searching && <ActivityIndicator size="small" color="#FF6B6B" />}
          </View>

          {showSuggestions && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((place, i) => {
                const parts = place.display_name.split(', ');
                const primary = parts.slice(0, 2).join(', ');
                const secondary = parts.slice(2, 4).join(', ');
                return (
                  <Pressable
                    key={`${place.lat}-${place.lon}-${i}`}
                    style={[styles.suggestionRow, i < suggestions.length - 1 && styles.suggestionBorder]}
                    onPress={() => selectSuggestion(place)}
                  >
                    <MapPin size={14} color="#FF6B6B" style={{ marginRight: 8, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionPrimary}>{primary}</Text>
                      {secondary ? <Text style={styles.suggestionSecondary}>{secondary}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Map picker */}
        <Text className="text-xs text-muted-foreground mb-2 mt-2">
          Tap the map to set the exact location
        </Text>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation
          >
            {pin && (
              <Marker
                coordinate={pin}
                draggable
                onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
              />
            )}
          </MapView>
          {pin && (
            <View style={styles.coordBadge}>
              <Text style={styles.coordText}>
                {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-sm font-body-bold text-foreground mb-2">Date</Text>
        <Pressable
          onPress={() => { setShowCreateDatePicker(!showCreateDatePicker); setShowCreateTimePicker(false); }}
          className="bg-card border border-border rounded-xl px-4 py-3 mb-2"
        >
          <Text className="text-foreground">
            {scheduledDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </Pressable>
        {showCreateDatePicker && (
          <View className="bg-card border border-border rounded-xl mb-2 overflow-hidden">
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              minimumDate={new Date()}
              onChange={(_, selected) => {
                if (Platform.OS === 'android') setShowCreateDatePicker(false);
                if (selected) setScheduledDate(prev => {
                  const d = new Date(selected);
                  d.setHours(prev.getHours(), prev.getMinutes());
                  return d;
                });
              }}
            />
          </View>
        )}
        <Text className="text-sm font-body-bold text-foreground mb-2">Time</Text>
        <Pressable
          onPress={() => { setShowCreateTimePicker(!showCreateTimePicker); setShowCreateDatePicker(false); }}
          className="bg-card border border-border rounded-xl px-4 py-3 mb-2"
        >
          <Text className="text-foreground">
            {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Pressable>
        {showCreateTimePicker && (
          <View className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant="light"
              onChange={(_, selected) => {
                if (Platform.OS === 'android') setShowCreateTimePicker(false);
                if (selected) setScheduledDate(prev => {
                  const d = new Date(prev);
                  d.setHours(selected.getHours(), selected.getMinutes());
                  return d;
                });
              }}
            />
          </View>
        )}

        <Text className="text-sm font-body-bold text-foreground mb-2">Max Participants</Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          placeholder="10"
          placeholderTextColor="#999"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="number-pad"
        />

        <Text className="text-sm font-body-bold text-foreground mb-2">Duration (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <Pressable
            onPress={() => { setCustomDuration(true); setDurationMinutes(null); setCustomDurationValue(''); setShowUnitDropdown(false); }}
            className={`mr-2 px-4 py-2.5 rounded-xl ${
              customDuration ? 'bg-primary' : 'bg-card border border-border'
            }`}
          >
            <Text className={customDuration ? 'text-white font-body-bold' : 'text-foreground'}>Custom</Text>
          </Pressable>
          {DURATION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.label}
              onPress={() => { setDurationMinutes(opt.value); setCustomDuration(false); setShowUnitDropdown(false); }}
              className={`mr-2 px-4 py-2.5 rounded-xl ${
                !customDuration && durationMinutes === opt.value ? 'bg-primary' : 'bg-card border border-border'
              }`}
            >
              <Text className={!customDuration && durationMinutes === opt.value ? 'text-white font-body-bold' : 'text-foreground'}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {customDuration && (
          <View className="flex-row items-center mb-4" style={{ zIndex: 20 }}>
            <TextInput
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-foreground flex-1 mr-2"
              placeholder={customDurationUnit.multiplier >= 60 ? 'e.g. 1.5' : 'e.g. 75'}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={customDurationValue}
              onChangeText={(t) => {
                setCustomDurationValue(t);
                const num = parseFloat(t);
                if (!isNaN(num) && num > 0) {
                  setDurationMinutes(Math.round(num * customDurationUnit.multiplier));
                } else {
                  setDurationMinutes(null);
                }
              }}
            />
            <View style={{ position: 'relative' }}>
              <Pressable
                onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                className="bg-card border border-border rounded-xl px-3 py-2.5 flex-row items-center"
              >
                <Text className="text-foreground font-body-bold mr-1">{customDurationUnit.label}</Text>
                <Text className="text-muted-foreground text-xs">{showUnitDropdown ? '▲' : '▼'}</Text>
              </Pressable>
              {showUnitDropdown && (
                <View className="bg-card border border-border rounded-xl overflow-hidden" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 100, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4, zIndex: 30 }}>
                  {DURATION_UNITS.map((u) => (
                    <Pressable
                      key={u.label}
                      onPress={() => {
                        setCustomDurationUnit(u);
                        setShowUnitDropdown(false);
                        const num = parseFloat(customDurationValue);
                        if (!isNaN(num) && num > 0) {
                          setDurationMinutes(Math.round(num * u.multiplier));
                        }
                      }}
                      className={`px-4 py-2.5 border-b border-border ${customDurationUnit.label === u.label ? 'bg-primary/10' : ''}`}
                    >
                      <Text className={customDurationUnit.label === u.label ? 'text-primary font-body-bold' : 'text-foreground'}>{u.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        {!customDuration && <View className="mb-4" />}

        <Pressable
          onPress={handleCreate}
          disabled={createActivity.isPending}
          className="bg-primary rounded-xl py-4 items-center mb-8"
        >
          {createActivity.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-body-bold text-base">Create Activity</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  suggestionSecondary: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  coordBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coordText: {
    color: '#fff',
    fontSize: 11,
  },
});
