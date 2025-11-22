import { Image, ImageSource } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface SessionCardProps {
  title: string;
  image: ImageSource;
  onPress?: () => void;
  style?: ViewStyle;
  rightActions?: React.ReactNode;
  disabled?: boolean;
}

export default function SessionCard({
  title,
  image,
  onPress,
  style,
  rightActions,
  disabled = false,
}: SessionCardProps) {
  return (
    <TouchableOpacity style={[styles.activityCard, style]} onPress={onPress} disabled={disabled}>
      <Image source={image} contentFit="cover" style={styles.activityImage} />

      {/* Overlay/“footer” preserved */}
      <View style={styles.overlay}>
        {/* Title left + actions right */}
        <View style={styles.activityTextContainer}>
          <Text style={styles.activityText}>{title}</Text>

          {rightActions && (
            <View style={styles.actionsRow}>
              {rightActions}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  activityImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  activityTextContainer: {
    flexDirection: 'row',          
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  activityText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_600SemiBold',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
});
