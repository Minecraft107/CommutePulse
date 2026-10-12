import { MetroRegion, TrafficIncident } from '../types/traffic';

export class TrafficAudioBroadcaster {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static isSpeaking: boolean = false;
  private static onStateChangeListeners: Array<(speaking: boolean) => void> = [];

  public static addListener(listener: (speaking: boolean) => void) {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(l => l !== listener);
    };
  }

  private static notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.onStateChangeListeners.forEach(listener => listener(speaking));
  }

  public static getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false);
    }
  }

  public static generateBroadcastScript(region: MetroRegion, selectedIncident?: TrafficIncident): string {
    if (selectedIncident) {
      return `Commuter alert update for ${selectedIncident.highway}. ${selectedIncident.title}. Reported ${selectedIncident.reportedAt}. Impact: ${selectedIncident.laneImpact}. ${selectedIncident.details} ${selectedIncident.clearingEstimate}. Commuters are advised to exercise caution or use alternate routes.`;
    }

    const criticalIncidents = region.incidents.filter(i => i.severity === 'critical' || i.severity === 'major');
    const topCorridorWithDelay = [...region.corridors].sort((a, b) => b.delayMinutes - a.delayMinutes)[0];

    let script = `This is your CommutePulse live traffic radar for the ${region.name}. Overall metro congestion is currently at ${region.overallCongestionScore} percent, with active peak flow. `;

    if (topCorridorWithDelay && topCorridorWithDelay.delayMinutes > 5) {
      script += `Major corridor bottleneck reported on ${topCorridorWithDelay.name}, running with an estimated delay of ${topCorridorWithDelay.delayMinutes} minutes. Travel time is now ${topCorridorWithDelay.currentDurationMinutes} minutes versus ${topCorridorWithDelay.freeFlowMinutes} normal minutes. `;
      if (topCorridorWithDelay.alternateRoute) {
        script += `Tip: Commuters can divert via ${topCorridorWithDelay.alternateRoute.name} to save approximately ${topCorridorWithDelay.alternateRoute.savesMinutes} minutes. `;
      }
    }

    if (criticalIncidents.length > 0) {
      const topInc = criticalIncidents[0];
      script += `Active urgent incident: ${topInc.title} on ${topInc.highway}. ${topInc.laneImpact}. ${topInc.clearingEstimate}. `;
    } else {
      script += `All main highway arteries are moving with moderate seasonal volumes. `;
    }

    if (region.weather.alert) {
      script += `Weather watch: ${region.weather.alert}. `;
    }

    script += `Drive safely and check live congestion maps for real-time corridor bypasses.`;
    return script;
  }

  public static speak(text: string, onEnd?: () => void) {
    if (!this.synth) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      onEnd?.();
    };

    utterance.onerror = () => {
      this.notify(false);
      onEnd?.();
    };

    this.synth.speak(utterance);
  }
}
