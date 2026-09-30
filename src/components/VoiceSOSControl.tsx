import React from 'react';
import { VoiceAssistantPanel } from './VoiceAssistantPanel';

interface VoiceSOSControlProps {
  onTriggerSOS: (commandMatch: string) => void;
  compact?: boolean;
}

/**
 * VoiceSOSControl component - renders the VoiceAssistant control panel for hands-free SOS activation.
 */
export const VoiceSOSControl: React.FC<VoiceSOSControlProps> = (props) => {
  return <VoiceAssistantPanel {...props} />;
};

export default VoiceSOSControl;
