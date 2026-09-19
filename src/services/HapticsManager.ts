import * as Haptics from 'expo-haptics';

export class HapticsManager {
  private static enabled: boolean = true;

  public static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public static tap(): void {
    if (!this.enabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  }

  public static kick(): void {
    if (!this.enabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  }

  public static wallHit(): void {
    if (!this.enabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
  }

  public static postHit(): void {
    if (!this.enabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
  }

  public static goal(): void {
    if (!this.enabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) {}
      }, 120);
    } catch (e) {}
  }

  public static save(): void {
    if (!this.enabled) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {}
  }
}
