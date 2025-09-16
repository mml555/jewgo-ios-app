import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MapIconProps {
  size?: number;
  color?: string;
}

const MapIcon: React.FC<MapIconProps> = ({ size = 16, color = '#333' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/>
    <Path d="M15 5.764v15"/>
    <Path d="M9 3.236v15"/>
  </Svg>
);

export default MapIcon;
