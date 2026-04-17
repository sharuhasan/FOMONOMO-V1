import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { useActivities } from '../../../../src/api/hooks';

const CATEGORY_COLORS: Record<string, string> = {
  sports: '#FF6B6B',
  food: '#FF9F43',
  music: '#A855F7',
  outdoors: '#22C55E',
  games: '#3B82F6',
  study: '#6366F1',
  social: '#EC4899',
  other: '#9CA3AF',
};

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { data } = useActivities({ upcoming: 'true', limit: '50' });

  const activities = data?.data ?? [];
  const activitiesWithCoords = activities.filter((a: any) => a.latitude && a.longitude);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: 37.78,
          longitude: -122.43,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {activitiesWithCoords.map((activity: any) => (
          <Marker
            key={activity.id}
            coordinate={{
              latitude: Number(activity.latitude),
              longitude: Number(activity.longitude),
            }}
            title={activity.title}
            description={activity.location}
            pinColor={CATEGORY_COLORS[activity.category?.toLowerCase()] || '#FF6B6B'}
            onCalloutPress={() => router.push(`/(app)/activity/${activity.id}`)}
          />
        ))}
      </MapView>

      {/* Bottom card overlay */}
      {activities.length > 0 && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>
            Nearby Activities ({activities.length})
          </Text>
          {activities.slice(0, 3).map((activity: any) => (
            <Pressable
              key={activity.id}
              onPress={() => router.push(`/(app)/activity/${activity.id}`)}
              style={styles.card}
            >
              <MapPin size={16} color={CATEGORY_COLORS[activity.category?.toLowerCase()] || '#FF6B6B'} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.cardTitle}>{activity.title}</Text>
                <Text style={styles.cardSubtitle}>{activity.location}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
  },
  overlayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
