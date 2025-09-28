import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../styles/designSystem';

interface GiftIconProps {
  size?: number;
  color?: string;
}

const GiftIcon: React.FC<GiftIconProps> = ({ 
  size = 24, 
  color = Colors.text.secondary 
}) => {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <Path d="M3 12v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <Path d="M3 12h18"/>
      <Path d="M12 22V12"/>
      <Path d="M12 22a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z"/>
      <Path d="M12 6a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2Z"/>
    </Svg>
  );
};

export default GiftIcon;
