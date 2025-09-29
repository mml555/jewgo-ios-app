import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface DatabaseDashboardButtonProps {
  onPress: () => void;
}

const DatabaseDashboardButton: React.FC<DatabaseDashboardButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonIcon}>🗄️</Text>
      <Text style={styles.buttonText}>Database Dashboard</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DatabaseDashboardButton;
