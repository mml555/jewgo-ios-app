import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MikvahIconProps {
  size?: number;
  color?: string;
}

const MikvahIcon: React.FC<MikvahIconProps> = ({ size = 16, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 5a2 2 0 0 0-2 2v11"/>
    <Path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    <Path d="M7 13h10"/>
    <Path d="M7 9h10"/>
    <Path d="M9 5a2 2 0 0 0-2 2v11"/>
  </Svg>
);

export default MikvahIcon;
