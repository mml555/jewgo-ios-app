import { Keyboard, Platform } from 'react-native';

/**
 * Utility class for managing keyboard interactions
 */
export class KeyboardManager {
  /**
   * Dismiss the keyboard
   */
  static dismiss(): void {
    Keyboard.dismiss();
  }

  /**
   * Add keyboard event listeners
   * @param onShow - Callback when keyboard shows
   * @param onHide - Callback when keyboard hides
   * @returns Cleanup function to remove listeners
   */
  static addListeners(
    onShow?: (event: any) => void,
    onHide?: (event: any) => void,
  ): () => void {
    const showEvent = 'keyboardDidShow';
    const hideEvent = 'keyboardDidHide';

    const showListener = onShow
      ? Keyboard.addListener(showEvent, onShow)
      : null;
    const hideListener = onHide
      ? Keyboard.addListener(hideEvent, onHide)
      : null;

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }

  /**
   * Get keyboard animation duration for iOS
   */
  static getAnimationDuration(): number {
    return Platform.OS === 'ios' ? 250 : 200;
  }

  /**
   * Check if keyboard is likely to be shown for a given input type
   */
  static shouldShowKeyboard(
    inputType: 'text' | 'email' | 'phone' | 'number' | 'time',
  ): boolean {
    // Time pickers don't show keyboard on iOS
    if (inputType === 'time' && Platform.OS === 'ios') {
      return false;
    }
    return true;
  }
}

export default KeyboardManager;
