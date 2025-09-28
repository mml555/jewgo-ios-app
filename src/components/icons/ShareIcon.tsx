import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../styles/designSystem';

interface ShareIconProps {
  size?: number;
  color?: string;
}

const ShareIcon: React.FC<ShareIconProps> = ({ 
  size = 24, 
  color = Colors.text.primary 
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
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <Path d="m16 6-4-4-4 4"/>
      <Path d="M12 2v13"/>
    </Svg>
  );
};

export default ShareIcon;
