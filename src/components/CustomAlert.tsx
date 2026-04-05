import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  onCancel?: () => void;
  destructive?: boolean;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  onSubmit?: (value: string) => void;
  type?: 'alert' | 'confirm' | 'prompt';
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  confirmText,
  onConfirm,
  cancelText,
  onCancel,
  destructive = false,
  inputPlaceholder,
  inputDefaultValue = '',
  onSubmit,
  type = 'alert',
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState(inputDefaultValue);

  useEffect(() => {
    if (visible) {
      setInputValue(inputDefaultValue);
    }
  }, [visible, inputDefaultValue]);

  const handleConfirm = () => {
    if (type === 'prompt') {
      onSubmit?.(inputValue);
    } else {
      onConfirm?.();
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const getConfirmText = () => {
    if (confirmText) return confirmText;
    if (type === 'prompt') return '저장';
    return '확인';
  };

  const getCancelText = () => {
    return cancelText || '취소';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={type === 'alert' ? handleConfirm : handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.container,
            isTablet && styles.containerTablet,
            { backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.title, isTablet && styles.titleTablet, { color: colors.text }]}>
            {title}
          </Text>

          {message ? (
            <Text style={[styles.message, isTablet && styles.messageTablet, { color: colors.textSecondary }]}>
              {message}
            </Text>
          ) : null}

          {type === 'prompt' && (
            <TextInput
              style={[styles.input, isTablet && styles.inputTablet, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={inputPlaceholder}
              placeholderTextColor={colors.textTertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
          )}

          <View style={[
            styles.buttonContainer,
            (type === 'confirm' || type === 'prompt') && styles.buttonContainerRow,
          ]}>
            {(type === 'confirm' || type === 'prompt') && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, isTablet && styles.buttonTablet, (type === 'confirm' || type === 'prompt') && styles.buttonFlex, { backgroundColor: colors.iconButtonBg }]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, isTablet && styles.buttonTextTablet, { color: colors.textSecondary }]}>
                  {getCancelText()}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.primary },
                destructive && { backgroundColor: colors.danger },
                isTablet && styles.buttonTablet,
                (type === 'confirm' || type === 'prompt') && styles.buttonFlex,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.confirmButtonText, isTablet && styles.buttonTextTablet]}>
                {getConfirmText()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
  },
  containerTablet: {
    maxWidth: 400,
    padding: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  titleTablet: {
    fontSize: 20,
  },
  message: {
    fontSize: 17,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageTablet: {
    fontSize: 18,
    lineHeight: 22,
  },
  input: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    color: '#1F2937',
  },
  inputTablet: {
    fontSize: 18,
    padding: 14,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  buttonContainerRow: {
    flexDirection: 'row',
  },
  buttonFlex: {
    flex: 1,
  },
  button: {
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTablet: {
    height: 48,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    backgroundColor: '#6366F1',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  buttonTextTablet: {
    fontSize: 19,
  },
});
