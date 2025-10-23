import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons'; 

export default function Configs({ navigation }) {
  const settings = [
    { id: '1', title: 'Ajuda', icon: <Ionicons name="ios-person-circle-outline" size={24} color="black" /> },
    { id: '2', title: 'Sobre', icon: <Entypo name="info-with-circle" size={24} color="black" /> },
    { id: '3', title: 'Permissões', icon: <MaterialIcons name="assignment" size={24} color="black" /> },
    { id: '4', title: 'Acessibilidade', icon: <FontAwesome5 name="universal-access" size={24} color="black" /> },
    { id: '5', title: 'Logout', icon: <Ionicons name="log-out-outline" size={24} color="black" /> },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => console.log(`${item.title} clicado`)}>
      <View style={styles.icon}>{item.icon}</View>
      <Text style={styles.title}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="black" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Configurações</Text>
      <FlatList
        data={settings}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50, 
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  icon: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  separator: {
    height: 1,
    backgroundColor: '#000',
    opacity: 0.1,
  },
});

