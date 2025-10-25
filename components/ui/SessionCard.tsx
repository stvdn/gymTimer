import { Image, ImageSource } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface SesssionCardProps {
  title: string;
  image: ImageSource;  
  onPress?: () => void;
  style?: ViewStyle;
}

export default function SessionCard({
  title,
  image,
  onPress,
  style,
}: SesssionCardProps) {
  return (
    <TouchableOpacity style={[styles.activityCard, style]} onPress={onPress}>
      <Image source={image} contentFit='cover' style={styles.activityImage} />
      <View
        style={styles.overlay}
      >
        <View style={styles.activityTextContainer}>
          <Text style={styles.activityText}>{title}</Text>
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
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.18)', // translucent white overlay
  },
  activityText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_600SemiBold',
  },
});