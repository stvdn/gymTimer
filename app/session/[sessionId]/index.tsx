import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SessionId() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(214); // 03:34 in seconds
  const [duration, setDuration] = useState<number>(354); // 05:54 in seconds
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayPause = (): void => {
    if (isPlaying) {
      // Pause
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play
      setIsPlaying(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime >= duration) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsPlaying(false);
            return duration;
          }
          return prevTime + 1;
        });
      }, 1000);
    }
  };

  const handleRewind = (): void => {
    setCurrentTime((prevTime) => Math.max(0, prevTime - 10));
  };

  const handleForward = (): void => {
    setCurrentTime((prevTime) => Math.min(duration, prevTime + 10));
  };

  const progress: number = (currentTime / duration) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meditation Time</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationPlaceholder}>
          <View style={styles.personPlaceholder}>
            <View style={styles.head} />
            <View style={styles.body} />
            <View style={styles.arms} />
            <View style={styles.legs} />
          </View>
          <View style={styles.bottleIcon} />
        </View>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(currentTime)}</Text>
        <Text style={styles.subtitle}>"Rilex your mind and take{'\n'}a slow breathe"</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            <View style={[styles.progressThumb, { left: `${progress}%` }]} />
          </View>
        </View>
        <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={handleRewind}>
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleForward}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Indicator */}
      <View style={styles.bottomIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 40,
  },
  illustrationPlaceholder: {
    width: width * 0.6,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  personPlaceholder: {
    width: 120,
    height: 100,
    position: 'relative',
  },
  head: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8a598',
    position: 'absolute',
    top: 0,
    left: 10,
  },
  body: {
    width: 50,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ff6b4a',
    position: 'absolute',
    top: 28,
    left: 0,
  },
  arms: {
    width: 60,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#ff6b4a',
    position: 'absolute',
    top: 35,
    left: -5,
  },
  legs: {
    width: 80,
    height: 25,
    borderRadius: 12,
    backgroundColor: '#5a4f7c',
    position: 'absolute',
    top: 65,
    left: -15,
  },
  bottleIcon: {
    width: 12,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#ff6b4a',
    position: 'absolute',
    bottom: 10,
    left: 20,
    opacity: 0.8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 16,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  timeLabel: {
    color: '#666',
    fontSize: 12,
    minWidth: 40,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#3a3a3a',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#ff6b4a',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff6b4a',
    top: -6,
    marginLeft: -8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 24,
    color: '#1a1a1a',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 32,
    color: '#1a1a1a',
    marginLeft: 3,
  },
  bottomIndicator: {
    width: 140,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3a3a3a',
    alignSelf: 'center',
    marginTop: 20,
  },
});
