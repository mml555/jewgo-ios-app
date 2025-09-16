import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HelpContentService, { HelpContent, TooltipContent } from '../services/HelpContent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HelpTooltipProps {
  fieldName: string;
  children: React.ReactNode;
  showOnLongPress?: boolean;
  showOnPress?: boolean;
  disabled?: boolean;
  interactionCount?: number;
}

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  content: HelpContent;
  fieldName: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose, content, fieldName }) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        onClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackground} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={styles.modalInner}>
            {/* Handle bar for swipe gesture */}
            <View style={styles.handleBar} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{content.title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>{content.description}</Text>

              {content.tips && content.tips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💡 Tips</Text>
                  {content.tips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {content.examples && content.examples.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>✅ Examples</Text>
                  {content.examples.map((example, index) => (
                    <View key={index} style={styles.exampleItem}>
                      <Text style={styles.exampleText}>{example}</Text>
                    </View>
                  ))}
                </View>
              )}

              {content.commonMistakes && content.commonMistakes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>❌ Common Mistakes</Text>
                  {content.commonMistakes.map((mistake, index) => (
                    <View key={index} style={styles.mistakeItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.mistakeText}>{mistake}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  fieldName,
  children,
  showOnLongPress = true,
  showOnPress = false,
  disabled = false,
  interactionCount = 0,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const helpService = HelpContentService.getInstance();

  const tooltipContent = helpService.getTooltip(fieldName);
  const helpContent = helpService.getFieldHelp(fieldName);
  const progressiveContent = helpService.getProgressiveHelp(fieldName, interactionCount);

  const handleLongPress = () => {
    if (disabled || !showOnLongPress) return;
    
    if (helpContent) {
      setShowModal(true);
    } else if (tooltipContent) {
      setTooltipVisible(true);
      setTimeout(() => setTooltipVisible(false), 3000);
    }
  };

  const handlePress = () => {
    if (disabled || !showOnPress) return;
    
    if (progressiveContent) {
      if (interactionCount >= 3 && helpContent) {
        setShowModal(true);
      } else if (tooltipContent) {
        setTooltipVisible(true);
        setTimeout(() => setTooltipVisible(false), 2000);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (disabled || (!tooltipContent && !helpContent)) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        onPress={handlePress}
        delayLongPress={500}
        activeOpacity={1}
        style={styles.touchableArea}
      >
        {children}
      </TouchableOpacity>

      {/* Quick tooltip */}
      {tooltipVisible && tooltipContent && (
        <View style={[
          styles.tooltip,
          tooltipContent.placement === 'top' && styles.tooltipTop,
          tooltipContent.placement === 'bottom' && styles.tooltipBottom,
          tooltipContent.placement === 'left' && styles.tooltipLeft,
          tooltipContent.placement === 'right' && styles.tooltipRight,
        ]}>
          <Text style={styles.tooltipText}>{tooltipContent.text}</Text>
          <View style={[
            styles.tooltipArrow,
            tooltipContent.placement === 'top' && styles.tooltipArrowTop,
            tooltipContent.placement === 'bottom' && styles.tooltipArrowBottom,
            tooltipContent.placement === 'left' && styles.tooltipArrowLeft,
            tooltipContent.placement === 'right' && styles.tooltipArrowRight,
          ]} />
        </View>
      )}

      {/* Detailed help modal */}
      {helpContent && (
        <HelpModal
          visible={showModal}
          onClose={closeModal}
          content={helpContent}
          fieldName={fieldName}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  touchableArea: {
    flex: 1,
  },
  
  // Tooltip styles
  tooltip: {
    position: 'absolute',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: 250,
    zIndex: 1000,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipTop: {
    bottom: '100%',
    left: '50%',
    marginLeft: -125,
    marginBottom: 8,
  },
  tooltipBottom: {
    top: '100%',
    left: '50%',
    marginLeft: -125,
    marginTop: 8,
  },
  tooltipLeft: {
    right: '100%',
    top: '50%',
    marginRight: 8,
    marginTop: -20,
  },
  tooltipRight: {
    left: '100%',
    top: '50%',
    marginLeft: 8,
    marginTop: -20,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  tooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  tooltipArrowTop: {
    top: '100%',
    left: '50%',
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000000',
  },
  tooltipArrowBottom: {
    bottom: '100%',
    left: '50%',
    marginLeft: -6,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#000000',
  },
  tooltipArrowLeft: {
    left: '100%',
    top: '50%',
    marginTop: -6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#000000',
  },
  tooltipArrowRight: {
    right: '100%',
    top: '50%',
    marginTop: -6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#000000',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.3,
  },
  modalInner: {
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#C7C7CC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    lineHeight: 20,
  },
  exampleItem: {
    backgroundColor: '#F2F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  exampleText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Menlo',
  },
  mistakeItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  mistakeText: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
    lineHeight: 20,
  },
});

export default HelpTooltip;