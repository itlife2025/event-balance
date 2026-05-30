import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/ThemeContext';
import { type NotificationItem } from '../context/NotificationContext';

interface NotificationPanelProps {
  visible: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onClearAll: () => void;
  onNotificationPress?: (item: NotificationItem) => void;
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '지금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  visible,
  notifications,
  onClose,
  onClearAll,
  onNotificationPress,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.panel, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>알림</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={onClearAll} activeOpacity={0.7}>
              <Text style={[styles.clearBtn, { color: colors.textSecondary }]}>전체 삭제</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>알림이 없습니다</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  { borderBottomColor: colors.borderLight },
                  index === notifications.length - 1 && styles.itemLast,
                ]}
                onPress={() => {
                  onNotificationPress?.(item);
                  onClose();
                }}
                activeOpacity={0.6}
              >
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemBody, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.body}
                  </Text>
                </View>
                <Text style={[styles.itemTime, { color: colors.textTertiary }]}>
                  {formatTime(item.receivedAt)}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 300,
    maxHeight: 400,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearBtn: {
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  list: {
    maxHeight: 340,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 11,
    marginTop: 2,
    flexShrink: 0,
  },
});
