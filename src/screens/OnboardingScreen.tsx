import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';

let Contacts: any = null;
if (Platform.OS !== 'web') {
  Contacts = require('expo-contacts');
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const handleAllow = async () => {
    if (Contacts) {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        onComplete();
        return;
      }
      Alert.alert(
        '연락처 권한 필요',
        '설정에서 연락처 접근을 허용해주세요.',
        [
          { text: '나중에', style: 'cancel', onPress: () => onComplete() },
          { text: '설정 열기', onPress: () => {
            Linking.openSettings();
            onComplete();
          }},
        ]
      );
      return;
    }
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📒</Text>
          </View>

          <Text style={styles.title}>연락처 접근 권한 안내</Text>

          <Text style={styles.description}>
            경조사비를 기록할 때 연락처에서{'\n'}
            이름과 전화번호를 바로 불러올 수 있습니다.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>연락처에서 이름/번호 자동 입력</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>전화번호 기반 거래 내역 조회</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>연락처 정보는 기기에서만 사용됩니다</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.allowButton} onPress={handleAllow}>
            <Text style={styles.allowButtonText}>허용하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>나중에</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  featureList: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 14,
    color: '#6366F1',
    marginRight: 8,
    marginTop: 1,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  allowButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
